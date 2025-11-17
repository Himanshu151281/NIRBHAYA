import { useEffect, useState, useRef } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// Configure Mapbox to handle telemetry blocking gracefully
if (typeof window !== 'undefined' && MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

export default function MapUI() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [viewport, setViewport] = useState({
    longitude: 77.209,
    latitude: 28.6139,
    zoom: 12
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported");
      return;
    }

    // Use standard accuracy for faster, more reliable results
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(currentLocation);
        setViewport({
          longitude: currentLocation.lng,
          latitude: currentLocation.lat,
          zoom: 15
        });
        console.log("✓ Location:", currentLocation);
        console.log("Accuracy:", Math.round(pos.coords.accuracy), "meters");
      },
      (error) => {
        console.error("Location error:", error.message);
        // Set default location (Delhi) on error
        const defaultLoc = { lat: 28.6139, lng: 77.209 };
        setLocation(defaultLoc);
        setViewport({ longitude: 77.209, latitude: 28.6139, zoom: 12 });
        console.log("Using default location");
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  }, []);

  // Search for places using Mapbox Geocoding API
  const handleSearch = async (query: string) => {
    if (!query.trim() || !MAPBOX_TOKEN) return;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=IN&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features || []);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  };

  const handleSelectPlace = (place: any) => {
    const [lng, lat] = place.center;
    const newLocation = { lat, lng };
    setLocation(newLocation);
    setViewport({
      longitude: lng,
      latitude: lat,
      zoom: 15
    });
    setSearchQuery(place.place_name);
    setSearchResults([]);
    console.log("Selected place location:", newLocation);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Mapbox Token Missing</h2>
          <p className="text-gray-700">Please set NEXT_PUBLIC_MAPBOX_TOKEN in your .env.local file</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative">
      <Map
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        onError={(e) => {
          console.warn('Map error (may be due to ad blocker):', e.error?.message || e);
        }}
      >
        <NavigationControl position="top-right" />
        
        {/* Marker at the location */}
        {location && (
          <Marker
            longitude={location.lng}
            latitude={location.lat}
            anchor="bottom"
          >
            <div className="w-8 h-8 bg-red-500 rounded-full border-2 border-white shadow-lg" />
          </Marker>
        )}
      </Map>

      {/* Search Input */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 w-96">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder="Search location..."
          className="px-6 py-4 text-xl rounded shadow-lg w-full"
        />
        
        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 bg-white rounded shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleSelectPlace(result)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              >
                <div className="font-medium">{result.text}</div>
                <div className="text-sm text-gray-600">{result.place_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

