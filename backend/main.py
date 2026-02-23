from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
    title="NIRBHAYA API - Route Clustering & MongoDB Blockchain",
    swagger_ui_parameters={
        "syntaxHighlight": {"theme": "obsidian"}
    }
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Middleware to disable caching - always serve fresh data
@app.middleware("http")
async def disable_cache_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

logging.basicConfig(level=logging.INFO)

# Load .env file
load_dotenv()

# Set Gemini API key and initialize client
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
gemini_client = None

if GEMINI_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_KEY)
        gemini_client = genai.GenerativeModel('gemini-2.5-flash')
    except ImportError:
        print("Warning: google-generativeai package not installed. Install with: pip install google-generativeai")
else:
    print("Warning: GEMINI_API_KEY not set in .env")


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
    center: List[float]
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
# Gemini helper
# ---------------------------
def gemini_query(prompt: str, context: str = "", model: str="gemini-pro", max_tokens: int=512) -> Dict[str, Any]:
    if not gemini_client:
        raise RuntimeError("Gemini client not configured. Check GEMINI_API_KEY.")
    
    full_prompt = f"{context}\n\n{prompt}" if context else prompt
    response = gemini_client.generate_content(full_prompt)
    
    return {
        "choices": [{
            "message": {
                "content": response.text
            }
        }],
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0
        }
    }

# ---------------------------
# Routes
# ---------------------------
@app.get("/")
async def root():
    return {"message": "NIRBHAYA Backend - MongoDB + Blockchain", "status": "running"}

@app.post("/query", response_model=QueryResponse)
async def query_gemini_endpoint(req: QueryRequest):
    try:
        resp = gemini_query(req.query, req.context)
        text = resp["choices"][0]["message"]["content"].strip()
        print(f"Gemini response: {text[:200]}...")
        return QueryResponse(answer=text, raw=resp)
    except Exception as e:
        logging.exception("Failed /query")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compute", response_model=ComputeResponse)
async def compute_clusters(req: ComputeRequest):
    logging.info(f"Starting compute_clusters with {len(req.records)} records")
    
    try:
        # Convert records to DataFrame
        df = pd.DataFrame([r.dict() if hasattr(r, 'dict') else r.model_dump() for r in req.records])
        initial_count = len(df)

        # Clean data
        df = df.dropna(subset=["lat","lon"])
        df = df.drop_duplicates(subset=["lat","lon","pincode"])
        df["pincode"] = df["pincode"].astype(str).str.strip()
        df = df[df["pincode"]!=""]

        # Filter within bounding box + corridor distance
        lat_min, lat_max = sorted([req.startingLat, req.endingLat])
        lon_min, lon_max = sorted([req.startingLong, req.endingLong])
        
        df = df[(df["lat"] >= lat_min) & (df["lat"] <= lat_max) &
                (df["lon"] >= lon_min) & (df["lon"] <= lon_max)].copy()

        # Distance-based corridor filtering
        route_len_m = haversine(req.startingLat, req.startingLong, req.endingLat, req.endingLong)
        threshold = min(20000.0, max(500.0, route_len_m*0.15))
        
        df["dist_to_route_m"] = df.apply(lambda r: point_to_segment_distance(
            r["lat"], r["lon"], req.startingLat, req.startingLong, req.endingLat, req.endingLong), axis=1)
        df = df[df["dist_to_route_m"] <= threshold]

        # Limit points
        if req.max_points and len(df) > req.max_points:
            df = df.sample(n=req.max_points, random_state=42)

        # Pincode filtering
        unique_pincodes = df.groupby("pincode").agg({"lat":"mean","lon":"mean"}).reset_index()
        used_pincodes: List[str] = unique_pincodes["pincode"].astype(str).tolist()
        
        df = df[df["pincode"].astype(str).isin(set(used_pincodes))]
        raw_used_points = len(df)

        # KMeans clustering
        coords = df[["lat","lon"]].to_numpy()
        if len(coords) == 0:
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
        
        from sklearn.preprocessing import StandardScaler
        scaler = StandardScaler()
        coords_scaled = scaler.fit_transform(coords)
        
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(coords_scaled)
        centers = scaler.inverse_transform(km.cluster_centers_)

        clusters_out: List[ClusterInfo] = []
        df["cluster"] = labels
        
        for cid in range(k):
            cluster_points = df[df["cluster"]==cid]
            samples = cluster_points.head(5).to_dict(orient="records")
            
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
        
        return response
    except Exception as e:
        logging.error(f"Error in compute endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------
# Include MongoDB & Blockchain Router
# ---------------------------
try:
    from routes.incident_blockchain import router as incident_router
    app.include_router(incident_router)
    logging.info("✅ MongoDB & Blockchain router loaded")
except ImportError as e:
    logging.warning(f"⚠️ Incident router not loaded: {e}")
except Exception as e:
    logging.error(f"❌ Error loading incident router: {e}")

@app.get("/health")
async def health():
    return {"status":"ok"}
