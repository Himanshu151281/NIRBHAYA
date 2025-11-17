from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
import os
import math
import re
import logging
from dotenv import load_dotenv

app = FastAPI(
    title="Route-Clustering API",
    swagger_ui_parameters={
        "syntaxHighlight": {"theme": "obsidian"}
    }
)

logging.basicConfig(level=logging.INFO)

# Load .env file
load_dotenv()  # looks for .env in current directory

# Set OpenAI API key and initialize client
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
openai_client = None

if OPENAI_KEY:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=OPENAI_KEY)
    except ImportError:
        print("Warning: OpenAI package not installed. Install with: pip install openai")
else:
    print("Warning: OPENAI_API_KEY not set in .env")


# ---------------------------
# Pydantic models
# ---------------------------
class QueryRequest(BaseModel):
    query: str = Field(..., example="List pincodes between Delhi and Gurgaon")
    context: str = Field("", example="You are a helpful assistant that provides route information.")

class QueryResponse(BaseModel):
    answer: str
    raw: Optional[Dict[str, Any]]

class Record(BaseModel):
    lat: float
    lon: float
    pincode: str

class ComputeRequest(BaseModel):
    startingLat: float
    startingLong: float
    endingLat: float
    endingLong: float
    records: List[Record]
    k: Optional[int] = Field(None, description="Optional: number of clusters")
    max_points: Optional[int] = Field(2000, description="Max points to consider for performance")

class ClusterInfo(BaseModel):
    cluster_id: int
    center: List[float]  # [lat, lon]
    size: int
    samples: List[Dict[str, Any]]

class ComputeResponse(BaseModel):
    clusters: List[ClusterInfo]
    cleaned_count: int
    removed_count: int
    used_pincodes: List[str]
    raw_used_points: int
    message: Optional[str]

# ---------------------------
# Geo utils
# ---------------------------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    c = 2*math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def point_to_segment_distance(lat, lon, lat1, lon1, lat2, lon2):
    x = math.radians(lon) * math.cos(math.radians((lat1 + lat2) / 2))
    y = math.radians(lat)
    x1 = math.radians(lon1) * math.cos(math.radians((lat1 + lat2) / 2))
    y1 = math.radians(lat1)
    x2 = math.radians(lon2) * math.cos(math.radians((lat1 + lat2) / 2))
    y2 = math.radians(lat2)
    px = x - x1
    py = y - y1
    dx = x2 - x1
    dy = y2 - y1
    d2 = dx*dx + dy*dy
    if d2 == 0:
        return haversine(lat, lon, lat1, lon1)
    t = max(0, min(1, (px*dx + py*dy)/d2))
    projx = x1 + t*dx
    projy = y1 + t*dy
    proj_lon = math.degrees(projx / math.cos(math.radians((lat1 + lat2) / 2)))
    proj_lat = math.degrees(projy)
    return haversine(lat, lon, proj_lat, proj_lon)

# ---------------------------
# OpenAI helper
# ---------------------------
def openai_query(prompt: str, context: str, model: str="gpt-4o-mini", max_tokens: int=512) -> Dict[str, Any]:
    if not openai_client:
        raise RuntimeError("OpenAI client not configured. Check OPENAI_API_KEY.")
    
    response = openai_client.chat.completions.create(
        model=model,
        messages=[
            {"role": "user", "content": f"""
            {context}

            {prompt}
             """
             }
        ],
        max_tokens=max_tokens,
        temperature=0.0
    )
    
    # Convert response to dict format similar to old API for compatibility
    return {
        "choices": [{
            "message": {
                "content": response.choices[0].message.content
            }
        }],
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens
        }
    }

# ---------------------------
# Routes
# ---------------------------
@app.post("/query", response_model=QueryResponse)
async def query_openai(req: QueryRequest):
    try:
        resp = openai_query(req.query, req.context)
        text = resp["choices"][0]["message"]["content"].strip()
        print(f"OpenAI response: {text[:200]}...")
        return QueryResponse(answer=text, raw=resp)
    except Exception as e:
        logging.exception("Failed /query")
        raise HTTPException(status_code=500, detail=str(e))

# New GET endpoint
@app.get("/")
async def get_query_info():
    """
    Example GET endpoint that returns a default message or info
    """
    try:
        return {"message": "HELLO BRO."}
    except Exception as e:
        logging.exception("Failed GET /query")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compute", response_model=ComputeResponse)
async def compute_clusters(req: ComputeRequest):
    logging.info(f"Starting compute_clusters with {len(req.records)} records")
    logging.info(f"Route: ({req.startingLat}, {req.startingLong}) -> ({req.endingLat}, {req.endingLong})")
    logging.info(f"Parameters: k={req.k}, max_points={req.max_points}")
    
    try:
        # Convert records to DataFrame
        df = pd.DataFrame([r.dict() if hasattr(r, 'dict') else r.model_dump() for r in req.records])
        initial_count = len(df)
        logging.info(f"Initial DataFrame created with {initial_count} records")
        logging.info(f"DataFrame columns: {df.columns.tolist()}")
        logging.info(f"DataFrame dtypes: {df.dtypes.to_dict()}")

        # Clean data
        logging.info("Starting data cleaning...")
        df = df.dropna(subset=["lat","lon"])
        logging.info(f"After dropping NaN lat/lon: {len(df)} records")
        
        df = df.drop_duplicates(subset=["lat","lon","pincode"])
        logging.info(f"After dropping duplicates: {len(df)} records")
        
        df["pincode"] = df["pincode"].astype(str).str.strip()
        df = df[df["pincode"]!=""]
        logging.info(f"After cleaning pincodes: {len(df)} records")

        # Filter within bounding box + corridor distance
        lat_min, lat_max = sorted([req.startingLat, req.endingLat])
        lon_min, lon_max = sorted([req.startingLong, req.endingLong])
        logging.info(f"Bounding box: lat({lat_min}, {lat_max}), lon({lon_min}, {lon_max})")
        
        df = df[(df["lat"] >= lat_min) & (df["lat"] <= lat_max) &
                (df["lon"] >= lon_min) & (df["lon"] <= lon_max)].copy()
        logging.info(f"After bounding box filter: {len(df)} records")

        # Distance-based corridor filtering
        route_len_m = haversine(req.startingLat, req.startingLong, req.endingLat, req.endingLong)
        threshold = min(20000.0, max(500.0, route_len_m*0.15))
        logging.info(f"Route length: {route_len_m:.2f}m, Distance threshold: {threshold:.2f}m")
        
        df["dist_to_route_m"] = df.apply(lambda r: point_to_segment_distance(
            r["lat"], r["lon"], req.startingLat, req.startingLong, req.endingLat, req.endingLong), axis=1)
        df = df[df["dist_to_route_m"] <= threshold]
        logging.info(f"After corridor distance filter: {len(df)} records")

        # Limit points
        if req.max_points and len(df) > req.max_points:
            df = df.sample(n=req.max_points, random_state=42)
            logging.info(f"Sampled down to {len(df)} records (max_points={req.max_points})")

        # OpenAI pincode filtering
        unique_pincodes = df.groupby("pincode").agg({"lat":"mean","lon":"mean"}).reset_index()
        logging.info(f"Unique pincodes found: {len(unique_pincodes)}")
        logging.info(f"Pincodes: {unique_pincodes['pincode'].tolist()}")
        
        used_pincodes: List[str] = []
        try:
            if openai_client and len(unique_pincodes) > 0:
                logging.info("Starting OpenAI pincode filtering...")
                rows = [f"{r['pincode']}: {r['lat']},{r['lon']}" for _,r in unique_pincodes.iterrows()]
                sample_text = "\n".join(rows[:200])
                prompt = (
                    f"Start: {req.startingLat},{req.startingLong}\n"
                    f"End: {req.endingLat},{req.endingLong}\n"
                    f"Pincodes list:\n{sample_text}\n\n"
                    "Return JSON array of pincodes plausibly along the route."
                )
                logging.info(f"OpenAI prompt length: {len(prompt)} chars")
                
                resp = openai_query(prompt)
                text = resp["choices"][0]["message"]["content"].strip()
                logging.info(f"OpenAI response: {text[:200]}...")
                
                match = re.search(r"(\[.*\])", text, flags=re.S)
                if match:
                    import json
                    used_pincodes = json.loads(match.group(1))
                    logging.info(f"Parsed JSON pincodes: {used_pincodes}")
                else:
                    used_pincodes = re.findall(r"\b\d{3,}\b", text)
                    logging.info(f"Regex extracted pincodes: {used_pincodes}")
                
                allowed = set(unique_pincodes["pincode"].astype(str).tolist())
                used_pincodes = [p for p in used_pincodes if str(p) in allowed]
                logging.info(f"Filtered valid pincodes: {used_pincodes}")
                
                if len(used_pincodes) == 0:
                    used_pincodes = unique_pincodes["pincode"].astype(str).tolist()
                    logging.info("No valid pincodes from OpenAI, using all unique pincodes")
            else:
                used_pincodes = unique_pincodes["pincode"].astype(str).tolist()
                logging.info("OpenAI not available or no pincodes, using all unique pincodes")
        except Exception as e:
            logging.error(f"Error in OpenAI filtering: {str(e)}")
            used_pincodes = unique_pincodes["pincode"].astype(str).tolist()
            logging.info("Fallback: using all unique pincodes")

        # Keep only rows with selected pincodes
        df = df[df["pincode"].astype(str).isin(set(used_pincodes))]
        raw_used_points = len(df)
        logging.info(f"After pincode filtering: {raw_used_points} records")

        # KMeans clustering
        coords = df[["lat","lon"]].to_numpy()
        if len(coords) == 0:
            logging.warning("No coordinates available for clustering")
            return ComputeResponse(
                clusters=[], 
                cleaned_count=0, 
                removed_count=initial_count,
                used_pincodes=used_pincodes, 
                raw_used_points=0, 
                message="No points found after filtering"
            )

        k = req.k if req.k else min(12, max(1, round(math.sqrt(len(coords)/2))))
        k = min(k, len(coords))
        logging.info(f"Using k={k} clusters for {len(coords)} points")
        
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        coords_scaled = scaler.fit_transform(coords)
        logging.info(f"Coordinates scaled, shape: {coords_scaled.shape}")
        
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(coords_scaled)
        centers = scaler.inverse_transform(km.cluster_centers_)
        logging.info(f"KMeans clustering completed, {len(set(labels))} clusters found")

        clusters_out: List[ClusterInfo] = []
        df["cluster"] = labels
        
        for cid in range(k):
            cluster_points = df[df["cluster"]==cid]
            samples = cluster_points.head(5).to_dict(orient="records")
            logging.info(f"Cluster {cid}: {len(cluster_points)} points, center: ({centers[cid][0]:.6f}, {centers[cid][1]:.6f})")
            
            # Ensure all values are properly typed
            cluster_info = ClusterInfo(
                cluster_id=int(cid),
                center=[float(centers[cid][0]), float(centers[cid][1])],
                size=int(len(cluster_points)),
                samples=[{
                    "lat": float(s["lat"]), 
                    "lon": float(s["lon"]), 
                    "pincode": str(s.get("pincode", ""))
                } for s in samples]
            )
            clusters_out.append(cluster_info)

        response = ComputeResponse(
            clusters=clusters_out,
            cleaned_count=int(len(df)),
            removed_count=int(initial_count - len(df)),
            used_pincodes=[str(p) for p in used_pincodes],
            raw_used_points=int(raw_used_points),
            message=f"kmeans_k={k}, route_length_meters={int(route_len_m)}"
        )
        
        logging.info(f"Response prepared: {len(clusters_out)} clusters, {len(df)} cleaned points")
        return response
        
    except Exception as e:
        logging.exception(f"Error in compute_clusters: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
        
@app.get("/health")
async def health():
    return {"status":"ok"}