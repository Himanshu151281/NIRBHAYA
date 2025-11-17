"use client";

import Nav from "@/components/custom/Nav";
import { useContext, useEffect, useRef, useState } from "react";
import Map, { Marker, NavigationControl, GeolocateControl, Layer, Source } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";

// Configure Mapbox to handle telemetry blocking gracefully
if (typeof window !== 'undefined') {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    mapboxgl.accessToken = token;
  }
}

// Type definitions
interface CustomDestination {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

interface HarassmentIncident {
  id: number;
  lat: number;
  lng: number;
  severity: "high" | "medium" | "low";
  date: string;
  type?: string;
  timeOfDay?: "morning" | "afternoon" | "evening" | "night";
  reportedBy?: string;
  title?: string;
  description?: string;
  location?: string;
}

interface SafetySettings {
  safetyMode: boolean;
  showIncidents: boolean;
  safetyBuffer: number;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

const MyMap: React.FC = () => {
  const [harassmentIncidents, setHarassmentIncidents] = useState<HarassmentIncident[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 28.7041, lng: 77.1025 });
  const [viewport, setViewport] = useState({
    longitude: 77.1025,
    latitude: 28.7041,
    zoom: 12
  });
  const [selectedDestination, setSelectedDestination] = useState<CustomDestination | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [routeData, setRouteData] = useState<any>(null);
  const [safetySettings, setSafetySettings] = useState<SafetySettings>({
    safetyMode: true,
    showIncidents: true,
    safetyBuffer: 500,
  });

  // Fetch real reports from local storage
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoadingReports(true);
        console.log("📊 Fetching reports from local storage...");
        
        const storedReports = localStorage.getItem("incident_reports");
        const reports = storedReports ? JSON.parse(storedReports) : [];
        
        console.log("✅ Fetched reports:", reports);
        
        if (reports && reports.length > 0) {
          const incidents: HarassmentIncident[] = reports.map((report: any) => ({
            id: report.id,
            lat: report.location.lat,
            lng: report.location.lng,
            severity: (report.severity || "medium").toLowerCase() as "high" | "medium" | "low",
            date: report.date || new Date(report.timestamp).toISOString().split('T')[0],
            title: report.title,
            description: report.description,
            location: report.location.address || `${report.location.lat}, ${report.location.lng}`,
          }));
          
          console.log("🗺️ Mapped incidents for display:", incidents);
          setHarassmentIncidents(incidents);
        } else {
          console.log("ℹ️ No reports found, map will be empty");
        }
      } catch (error) {
        console.error("❌ Error fetching reports:", error);
      } finally {
        setIsLoadingReports(false);
      }
    };
    
    fetchReports();
  }, []);

  // Get user's current location with better error handling
  useEffect(() => {
    const getLocation = () => {
      if (!navigator.geolocation) {
        console.error("❌ Geolocation is not supported by your browser");
        return;
      }

      console.log("🔍 Requesting location permission...");

      // First try: Quick network-based location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(loc);
          setMapCenter(loc);
          setViewport({
            longitude: loc.lng,
            latitude: loc.lat,
            zoom: 15
          });
          console.log("✅ Location found:", loc);
          console.log("📍 Accuracy:", Math.round(position.coords.accuracy), "meters");
          console.log("⏱️ Time:", new Date(position.timestamp).toLocaleTimeString());
        },
        (error) => {
          console.error("❌ Location error:", error.message, "Code:", error.code);
          
          // Try high accuracy as fallback
          if (error.code === 3) { // TIMEOUT
            console.log("⚠️ Timeout with standard accuracy, trying high accuracy...");
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const loc = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                setCurrentLocation(loc);
                setMapCenter(loc);
                setViewport({
                  longitude: loc.lng,
                  latitude: loc.lat,
                  zoom: 15
                });
                console.log("✅ High accuracy location found:", loc);
                console.log("📍 Accuracy:", Math.round(position.coords.accuracy), "meters");
              },
              (error2) => {
                console.error("❌ High accuracy also failed:", error2.message);
                // Set default location (Delhi) on error
                const defaultLoc = { lat: 28.6139, lng: 77.209 };
                setCurrentLocation(defaultLoc);
                setMapCenter(defaultLoc);
                setViewport({ longitude: 77.209, latitude: 28.6139, zoom: 12 });
                console.log("🏙️ Using default location (Delhi)");
              },
              {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
              }
            );
          } else {
            // Other errors (permission denied, position unavailable)
            const defaultLoc = { lat: 28.6139, lng: 77.209 };
            setCurrentLocation(defaultLoc);
            setMapCenter(defaultLoc);
            setViewport({ longitude: 77.209, latitude: 28.6139, zoom: 12 });
            console.log("🏙️ Using default location (Delhi)");
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 30000
        }
      );
    };

    getLocation();
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

  // Handle destination selection
  const handleSelectDestination = (place: any) => {
    const [lng, lat] = place.center;
    const destination: CustomDestination = {
      lat,
      lng,
      name: place.text,
      address: place.place_name,
    };
    setSelectedDestination(destination);
    setSearchQuery(place.place_name);
    setSearchResults([]);
    setViewport({ ...viewport, longitude: lng, latitude: lat, zoom: 14 });
    
    // Get route if we have current location
    if (currentLocation) {
      getRoute(currentLocation, destination);
    }
  };

  // Get route using Mapbox Directions API
  const getRoute = async (start: {lat: number; lng: number}, end: CustomDestination) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        setRouteData(data.routes[0]);
      }
    } catch (error) {
      console.error("Route error:", error);
    }
  };

  const clearRoute = () => {
    setRouteData(null);
    setSelectedDestination(null);
    setSearchQuery("");
  };

  const getSeverityColor = (severity: HarassmentIncident["severity"]): string => {
    switch (severity) {
      case "high":
        return "#ff4444";
      case "medium":
        return "#ffaa00";
      case "low":
        return "#ffdd00";
      default:
        return "#ff4444";
    }
  };

  const getSeverityRadius = (severity: HarassmentIncident["severity"]): number => {
    switch (severity) {
      case "high":
        return safetySettings.safetyBuffer * 1.5;
      case "medium":
        return safetySettings.safetyBuffer;
      case "low":
        return safetySettings.safetyBuffer * 0.7;
      default:
        return safetySettings.safetyBuffer;
    }
  };

  const updateSafetySettings = (updates: Partial<SafetySettings>): void => {
    setSafetySettings((prev) => ({ ...prev, ...updates }));
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex flex-col h-screen">
        <Nav />
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Mapbox Configuration Error</h2>
            <p className="text-gray-700">NEXT_PUBLIC_MAPBOX_TOKEN is missing from environment variables</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Nav />
      <div className="flex flex-1 relative">
        {/* Map */}
        <div className="flex-1">
          <Map
            {...viewport}
            onMove={(evt) => setViewport(evt.viewState)}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            style={{ width: "100%", height: "100%" }}
            onError={(e) => {
              // Suppress telemetry errors from ad blockers
              if (e.error?.message?.includes('NetworkError') || e.error?.message?.includes('events.mapbox')) {
                console.warn('Mapbox telemetry blocked (ad blocker). Map functionality will continue.');
              } else {
                console.error('Map error:', e.error?.message || e);
              }
            }}
          >
            <NavigationControl position="top-right" />
            <GeolocateControl
              position="top-right"
              trackUserLocation={true}
              showUserHeading={true}
              showAccuracyCircle={true}
              positionOptions={{
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
              }}
              onGeolocate={(e) => {
                const loc = {
                  lat: e.coords.latitude,
                  lng: e.coords.longitude,
                };
                setCurrentLocation(loc);
                setMapCenter(loc);
                setViewport({
                  longitude: loc.lng,
                  latitude: loc.lat,
                  zoom: 16
                });
                console.log("🎯 GeolocateControl updated location:", loc);
                console.log("📍 Accuracy:", Math.round(e.coords.accuracy), "meters");
              }}
              onError={(e) => {
                console.error("❌ GeolocateControl error:", e.message);
              }}
            />

            {/* Current location marker */}
            {currentLocation && (
              <Marker
                longitude={currentLocation.lng}
                latitude={currentLocation.lat}
                anchor="bottom"
              >
                <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
              </Marker>
            )}

            {/* Selected destination marker */}
            {selectedDestination && (
              <Marker
                longitude={selectedDestination.lng}
                latitude={selectedDestination.lat}
                anchor="bottom"
              >
                <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg" />
              </Marker>
            )}

            {/* Harassment incident markers */}
            {safetySettings.showIncidents &&
              harassmentIncidents.map((incident) => (
                <Marker
                  key={incident.id}
                  longitude={incident.lng}
                  latitude={incident.lat}
                  anchor="center"
                >
                  <div
                    className="relative cursor-pointer"
                    style={{
                      width: `${getSeverityRadius(incident.severity) / 5}px`,
                      height: `${getSeverityRadius(incident.severity) / 5}px`,
                    }}
                    title={`${incident.title || 'Incident'} - ${incident.severity} severity\n${incident.description || ''}\n${incident.location || ''}`}
                  >
                    <div
                      className="absolute inset-0 rounded-full opacity-30"
                      style={{
                        backgroundColor: getSeverityColor(incident.severity),
                      }}
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        backgroundColor: getSeverityColor(incident.severity),
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      !
                    </div>
                  </div>
                </Marker>
              ))}

            {/* Route line */}
            {routeData && (
              <Source
                id="route"
                type="geojson"
                data={{
                  type: "Feature",
                  properties: {},
                  geometry: routeData.geometry,
                }}
              >
                <Layer
                  id="route"
                  type="line"
                  paint={{
                    "line-color": "#3b82f6",
                    "line-width": 4,
                    "line-opacity": 0.8,
                  }}
                />
              </Source>
            )}
          </Map>
        </div>

        {/* Side panel */}
        <div className="w-96 bg-white shadow-lg overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Safe Route Finder</h2>

          {/* Current Location Display */}
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">📍 Current Location</span>
              <button
                onClick={() => {
                  console.log("🔄 Manually requesting location...");
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const loc = {
                          lat: position.coords.latitude,
                          lng: position.coords.longitude,
                        };
                        setCurrentLocation(loc);
                        setMapCenter(loc);
                        setViewport({
                          longitude: loc.lng,
                          latitude: loc.lat,
                          zoom: 16
                        });
                        console.log("✅ Manual location update:", loc);
                        console.log("📍 Accuracy:", Math.round(position.coords.accuracy), "meters");
                      },
                      (error) => {
                        console.error("❌ Manual location error:", error.message);
                        alert("Location error: " + error.message);
                      },
                      {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0
                      }
                    );
                  }
                }}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                🔄 Refresh
              </button>
            </div>
            {currentLocation ? (
              <div className="text-xs text-gray-600">
                <div>Lat: {currentLocation.lat.toFixed(6)}</div>
                <div>Lng: {currentLocation.lng.toFixed(6)}</div>
              </div>
            ) : (
              <div className="text-xs text-gray-500">Loading...</div>
            )}
          </div>

          {/* Search box */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Search Destination
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Enter destination..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-lg shadow-lg max-h-60 overflow-y-auto bg-white">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectDestination(result)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-medium">{result.text}</div>
                    <div className="text-sm text-gray-600">{result.place_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Route info */}
          {routeData && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2">Route Information</h3>
              <p className="text-sm">
                <strong>Distance:</strong> {(routeData.distance / 1000).toFixed(2)} km
              </p>
              <p className="text-sm">
                <strong>Duration:</strong> {Math.round(routeData.duration / 60)} min
              </p>
              <button
                onClick={clearRoute}
                className="mt-2 w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Clear Route
              </button>
            </div>
          )}

          {/* Safety settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Safety Settings</h3>
              <button
                onClick={() => {
                  setIsLoadingReports(true);
                  try {
                    console.log("🔄 Refreshing reports...");
                    const storedReports = localStorage.getItem("incident_reports");
                    const reports = storedReports ? JSON.parse(storedReports) : [];
                    
                    if (reports && reports.length > 0) {
                      const incidents: HarassmentIncident[] = reports.map((report: any) => ({
                        id: report.id,
                        lat: report.location.lat,
                        lng: report.location.lng,
                        severity: (report.severity || "medium").toLowerCase() as "high" | "medium" | "low",
                        date: report.date || new Date(report.timestamp).toISOString().split('T')[0],
                        title: report.title,
                        description: report.description,
                        location: report.location.address || `${report.location.lat}, ${report.location.lng}`,
                      }));
                      setHarassmentIncidents(incidents);
                      console.log("✅ Reports refreshed:", incidents.length);
                    }
                  } catch (error) {
                    console.error("❌ Error refreshing reports:", error);
                  } finally {
                    setIsLoadingReports(false);
                  }
                }}
                disabled={isLoadingReports}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isLoadingReports ? "⏳" : "🔄"} Refresh
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm">Safety Mode</label>
              <input
                type="checkbox"
                checked={safetySettings.safetyMode}
                onChange={(e) =>
                  updateSafetySettings({ safetyMode: e.target.checked })
                }
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm">Show Incidents</label>
              <input
                type="checkbox"
                checked={safetySettings.showIncidents}
                onChange={(e) =>
                  updateSafetySettings({ showIncidents: e.target.checked })
                }
                className="w-5 h-5"
              />
            </div>

            <div>
              <label className="text-sm block mb-2">
                Safety Buffer: {safetySettings.safetyBuffer}m
              </label>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={safetySettings.safetyBuffer}
                onChange={(e) =>
                  updateSafetySettings({
                    safetyBuffer: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Incident statistics */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-4">Incident Statistics</h3>
            {isLoadingReports ? (
              <div className="text-center py-4 text-sm text-gray-500">Loading reports...</div>
            ) : harassmentIncidents.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">No incidents reported yet</div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 mr-2" />
                    <span className="text-sm">High Risk</span>
                  </div>
                  <span className="text-sm font-medium">
                    {harassmentIncidents.filter((i) => i.severity === "high").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2" />
                    <span className="text-sm">Medium Risk</span>
                  </div>
                  <span className="text-sm font-medium">
                    {harassmentIncidents.filter((i) => i.severity === "medium").length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-yellow-300 mr-2" />
                    <span className="text-sm">Low Risk</span>
                  </div>
                  <span className="text-sm font-medium">
                    {harassmentIncidents.filter((i) => i.severity === "low").length}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Total Reports</span>
                    <span>{harassmentIncidents.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyMap;
