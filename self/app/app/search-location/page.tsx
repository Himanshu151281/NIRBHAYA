"use client";

import Nav from "@/components/custom/Nav";
import { useContext, useEffect, useRef, useState } from "react";
import Map, { Marker, NavigationControl, GeolocateControl, Layer, Source, Popup } from "react-map-gl";
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
  images?: string[]; // Add images array
  metadata?: any; // Add metadata for additional info
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
  const [selectedIncident, setSelectedIncident] = useState<HarassmentIncident | null>(null); // Add selected incident state
  const [previewImage, setPreviewImage] = useState<string | null>(null); // Image preview modal state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [routeData, setRouteData] = useState<any>(null);
  const [safetySettings, setSafetySettings] = useState<SafetySettings>({
    safetyMode: true,
    showIncidents: true,
    safetyBuffer: 500,
  });

  // Fetch real reports from backend API
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoadingReports(true);
        console.log("📊 Fetching reports from backend API...");
        
        // Fetch from backend API instead of localStorage
        const response = await fetch(`http://localhost:8000/api/incidents/list?limit=100&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const reports = data.incidents || [];
        
        console.log("✅ Fetched reports from API:", reports);
        
        if (reports && reports.length > 0) {
          const incidents: HarassmentIncident[] = reports
            .map((report: any) => {
              // Parse coordinates safely
              let lat = 0;
              let lng = 0;

              // Try different possible locations for coordinates
              if (report.metadata?.location?.coordinates) {
                lng = parseFloat(report.metadata.location.coordinates[0]) || 0;
                lat = parseFloat(report.metadata.location.coordinates[1]) || 0;
              } else if (report.location?.coordinates) {
                lng = parseFloat(report.location.coordinates[0]) || 0;
                lat = parseFloat(report.location.coordinates[1]) || 0;
              } else if (report.lat && report.lng) {
                lat = parseFloat(report.lat) || 0;
                lng = parseFloat(report.lng) || 0;
              }

              console.log(`📍 Incident ${report.id}: lat=${lat}, lng=${lng}`);

              return {
                id: report._id || report.id,
                lat: lat,
                lng: lng,
                severity: (report.severity || "medium").toLowerCase() as "high" | "medium" | "low",
                date: report.timestamp ? new Date(report.timestamp).toLocaleDateString() : new Date().toLocaleDateString(),
                title: report.title || report.incident_type || "Incident",
                description: report.description || report.details || "",
                location: report.address || report.location?.address || `${lat}, ${lng}`,
                images: report.metadata?.images || report.images || [],
                metadata: report.metadata || {},
              };
            })
            .filter((incident: any) => incident.lat !== 0 && incident.lng !== 0); // Filter out invalid coordinates
          
          console.log("🗺️ Mapped incidents for display:", incidents);
          console.log("🖼️ Images in incidents:", incidents.map(i => ({ id: i.id, imageCount: i.images?.length || 0 })));
          setHarassmentIncidents(incidents);
        } else {
          console.log("ℹ️ No reports found, map will be empty");
        }
      } catch (error) {
        console.error("❌ Error fetching reports:", error);
        // Fallback to localStorage if API fails
        try {
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
              images: report.images || [],
              metadata: report.metadata || {},
            }));
            setHarassmentIncidents(incidents);
          }
        } catch (localStorageError) {
          console.error("❌ LocalStorage fallback also failed:", localStorageError);
        }
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

  // Get route using Mapbox Directions API with safety optimization
  const getRoute = async (start: {lat: number; lng: number}, end: CustomDestination) => {
    try {
      // Request multiple alternative routes for safety comparison
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start.lng},${start.lat};${end.lng},${end.lat}?geometries=geojson&alternatives=true&steps=true&access_token=${MAPBOX_TOKEN}`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        if (safetySettings.safetyMode) {
          // Calculate safety score for each route
          const routesWithSafety = data.routes.map((route: any) => {
            const coordinates = route.geometry.coordinates;
            const safety = calculateRouteSafety(coordinates);
            return { ...route, safety };
          });

          // Sort by safety score (highest first)
          routesWithSafety.sort((a: any, b: any) => b.safety.score - a.safety.score);

          console.log("🛣️ Route Safety Analysis:");
          routesWithSafety.forEach((route: any, index: number) => {
            console.log(`  Route ${index + 1}: Safety ${route.safety.score}/100, Distance ${(route.distance / 1000).toFixed(1)}km, Duration ${Math.round(route.duration / 60)}min`);
          });

          // Select safest route
          const safestRoute = routesWithSafety[0];
          console.log(`✅ Selected safest route with score: ${safestRoute.safety.score}/100`);
          setRouteData(safestRoute);
        } else {
          // Safety mode off - use shortest route
          setRouteData(data.routes[0]);
        }
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

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Calculate incident clustering density to determine critical zones
  // Returns cluster multiplier: 1.0 (isolated) to 3.0+ (hot zone)
  const calculateIncidentClustering = (incident: HarassmentIncident): number => {
    const clusterRadius = 1000; // 1km radius to check for nearby incidents
    let nearbyCount = 0;
    let totalSeverityWeight = 0;

    harassmentIncidents.forEach((otherIncident) => {
      if (otherIncident.id === incident.id) return; // Skip self

      const distance = calculateDistance(
        incident.lat, 
        incident.lng, 
        otherIncident.lat, 
        otherIncident.lng
      );

      if (distance <= clusterRadius) {
        nearbyCount++;
        
        // Weight by severity of nearby incidents
        const severityWeight = otherIncident.severity === 'high' ? 3 : 
                               otherIncident.severity === 'medium' ? 2 : 1;
        
        // Closer incidents contribute more to danger
        const proximityFactor = 1 - (distance / clusterRadius);
        totalSeverityWeight += severityWeight * proximityFactor;
      }
    });

    // Calculate cluster multiplier based on density
    // 0 nearby = 1.0x (isolated incident)
    // 1-2 nearby = 1.5x (small cluster)
    // 3-4 nearby = 2.0x (medium cluster)
    // 5+ nearby = 2.5-3.5x (critical hot zone)
    const baseMultiplier = 1.0;
    const countMultiplier = Math.min(nearbyCount * 0.3, 2.0);
    const severityMultiplier = Math.min(totalSeverityWeight * 0.2, 1.5);

    return baseMultiplier + countMultiplier + severityMultiplier;
  };

  // Calculate safety score for a route (0-100, higher is safer)
  const calculateRouteSafety = (routeCoordinates: [number, number][]): {
    score: number;
    nearbyIncidents: Array<{incident: HarassmentIncident; distance: number; clusterMultiplier: number}>;
    warnings: string[];
  } => {
    if (!routeCoordinates || routeCoordinates.length === 0) {
      return { score: 100, nearbyIncidents: [], warnings: [] };
    }

    let totalDangerScore = 0;
    const nearbyIncidents: Array<{incident: HarassmentIncident; distance: number; clusterMultiplier: number}> = [];
    const warnings: string[] = [];

    // Check each point on the route against all incidents
    routeCoordinates.forEach(([lng, lat]) => {
      harassmentIncidents.forEach((incident) => {
        const distance = calculateDistance(lat, lng, incident.lat, incident.lng);
        const dangerRadius = getSeverityRadius(incident.severity);

        if (distance < dangerRadius) {
          // Calculate cluster multiplier for this incident
          const clusterMultiplier = calculateIncidentClustering(incident);

          // Weight danger by severity, proximity, and clustering
          const severityWeight = incident.severity === 'high' ? 3 : incident.severity === 'medium' ? 2 : 1;
          const proximityFactor = 1 - (distance / dangerRadius); // 0 to 1, higher when closer
          const dangerScore = severityWeight * proximityFactor * clusterMultiplier * 10;
          
          totalDangerScore += dangerScore;

          // Track nearby incidents with cluster info
          const existing = nearbyIncidents.find(ni => ni.incident.id === incident.id);
          if (!existing || distance < existing.distance) {
            if (existing) {
              nearbyIncidents.splice(nearbyIncidents.indexOf(existing), 1);
            }
            nearbyIncidents.push({ incident, distance, clusterMultiplier });
          }
        }
      });
    });

    // Generate warnings with cluster awareness
    if (nearbyIncidents.length > 0) {
      const highSeverityCount = nearbyIncidents.filter(ni => ni.incident.severity === 'high').length;
      const mediumSeverityCount = nearbyIncidents.filter(ni => ni.incident.severity === 'medium').length;
      const lowSeverityCount = nearbyIncidents.filter(ni => ni.incident.severity === 'low').length;

      // Check for critical hot zones (high cluster multiplier)
      const criticalZones = nearbyIncidents.filter(ni => ni.clusterMultiplier >= 2.5);
      if (criticalZones.length > 0) {
        warnings.push(`🔴 CRITICAL: ${criticalZones.length} high-density incident zone${criticalZones.length > 1 ? 's' : ''} ahead`);
      }

      if (highSeverityCount > 0) {
        warnings.push(`⚠️ ${highSeverityCount} high-risk incident${highSeverityCount > 1 ? 's' : ''} nearby`);
      }
      if (mediumSeverityCount > 0) {
        warnings.push(`⚡ ${mediumSeverityCount} medium-risk incident${mediumSeverityCount > 1 ? 's' : ''} nearby`);
      }
      if (lowSeverityCount > 0) {
        warnings.push(`ℹ️ ${lowSeverityCount} low-risk incident${lowSeverityCount > 1 ? 's' : ''} nearby`);
      }
    }

    // Calculate safety score (0-100)
    const maxDangerScore = 100; // Normalize to 0-100 scale
    const safetyScore = Math.max(0, Math.min(100, 100 - (totalDangerScore / routeCoordinates.length) * 10));

    return {
      score: Math.round(safetyScore),
      nearbyIncidents: nearbyIncidents.sort((a, b) => a.distance - b.distance).slice(0, 5), // Top 5 closest
      warnings
    };
  };

  const updateSafetySettings = (updates: Partial<SafetySettings>): void => {
    setSafetySettings((prev) => ({ ...prev, ...updates }));
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex flex-col h-screen">
        <Nav />
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100">
          <div className="text-center p-8 bg-white rounded-2xl shadow-xl border-2 border-purple-200">
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
            onClick={() => setSelectedIncident(null)}
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
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setSelectedIncident(incident);
                  }}
                >
                  <div
                    className="relative cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      width: `${getSeverityRadius(incident.severity) / 5}px`,
                      height: `${getSeverityRadius(incident.severity) / 5}px`,
                    }}
                    title={`${incident.title || 'Incident'} - Click for details`}
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

            {/* Incident Details Popup */}
            {selectedIncident && (
              <Popup
                longitude={selectedIncident.lng}
                latitude={selectedIncident.lat}
                closeOnClick={false}
                onClose={() => setSelectedIncident(null)}
                anchor="bottom"
                offset={30}
                className="incident-popup"
              >
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ width: '380px', maxWidth: '90vw' }}>
                  {/* Header with gradient */}
                  <div 
                    className="p-5 text-white relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${getSeverityColor(selectedIncident.severity)} 0%, ${getSeverityColor(selectedIncident.severity)}dd 100%)`,
                    }}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="inline-block px-3 py-1 bg-white bg-opacity-30 rounded-full text-xs font-semibold mb-2 backdrop-blur-sm">
                            🚨 {selectedIncident.severity?.toUpperCase() || "ALERT"} SEVERITY
                          </div>
                          <h3 className="text-xl font-bold leading-tight">
                            {selectedIncident.title || "Incident Report"}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white text-opacity-95">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{selectedIncident.location || "Unknown Location"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Description */}
                    {selectedIncident.description && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {selectedIncident.description}
                        </p>
                      </div>
                    )}

                    {/* Images Preview */}
                    {selectedIncident.images && selectedIncident.images.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            Evidence Photos
                          </h4>
                          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                            {selectedIncident.images.length} {selectedIncident.images.length === 1 ? 'Photo' : 'Photos'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {selectedIncident.images.slice(0, 6).map((image, index) => (
                            <div 
                              key={index}
                              className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                              onClick={() => setPreviewImage(image)}
                            >
                              <img
                                src={image}
                                alt={`Evidence ${index + 1}`}
                                className="w-full h-24 object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                              </div>
                              {index === 5 && selectedIncident.images.length > 6 && (
                                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                                  <span className="text-white text-lg font-bold">
                                    +{selectedIncident.images.length - 6}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center italic">
                          💡 Click on any photo to view full size
                        </p>
                      </div>
                    )}

                    {/* Footer Info */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Incident ID:</span> {selectedIncident.id?.slice(-8) || "N/A"}
                      </div>
                      <div className="text-xs text-gray-400">
                        📅 {selectedIncident.date || new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            )}

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
        <div className="w-96 bg-white shadow-2xl overflow-y-auto p-6 border-r border-purple-100">
          <h2 className="text-2xl font-bold mb-4">Safe Route Finder</h2>

          {/* Current Location Display */}
          <div className="mb-4 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
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
                className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full hover:shadow-lg transition-all duration-200"
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

          {/* Route info with safety analysis */}
          {routeData && (
            <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-blue-900">
                  {safetySettings.safetyMode ? '🛡️ Safest Route' : '🚗 Route Information'}
                </h3>
                {routeData.safety && (
                  <div className={`px-3 py-1 rounded-full font-bold text-sm ${
                    routeData.safety.score >= 80 ? 'bg-green-500 text-white' :
                    routeData.safety.score >= 60 ? 'bg-yellow-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    Safety: {routeData.safety.score}/100
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-3">
                <p className="text-sm flex justify-between">
                  <span className="font-semibold text-gray-700">Distance:</span>
                  <span className="text-gray-900">{(routeData.distance / 1000).toFixed(2)} km</span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="font-semibold text-gray-700">Duration:</span>
                  <span className="text-gray-900">{Math.round(routeData.duration / 60)} min</span>
                </p>
              </div>

              {/* Safety warnings */}
              {routeData.safety && routeData.safety.warnings.length > 0 && (
                <div className="mb-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="font-semibold text-sm text-yellow-800 mb-1">⚠️ Safety Alerts:</p>
                  <ul className="text-xs space-y-1 text-yellow-700">
                    {routeData.safety.warnings.map((warning: string, idx: number) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nearby incidents details */}
              {routeData.safety && routeData.safety.nearbyIncidents.length > 0 && (
                <div className="mb-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <p className="font-semibold text-sm text-gray-800 mb-2">📍 Nearby Incidents:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {routeData.safety.nearbyIncidents.map((ni: any, idx: number) => (
                      <div key={idx} className="text-xs p-2 bg-gray-50 rounded border-l-3" style={{
                        borderLeftColor: getSeverityColor(ni.incident.severity),
                        borderLeftWidth: '3px'
                      }}>
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-gray-800">
                            {ni.incident.title || ni.incident.type || 'Incident'}
                          </div>
                          {/* Cluster density indicator */}
                          {ni.clusterMultiplier >= 2.5 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                              🔥 HOT ZONE
                            </span>
                          )}
                          {ni.clusterMultiplier >= 1.8 && ni.clusterMultiplier < 2.5 && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                              ⚠️ CLUSTER
                            </span>
                          )}
                        </div>
                        <div className="text-gray-600 mt-1">
                          <span className={`font-medium ${
                            ni.incident.severity === 'high' ? 'text-red-600' :
                            ni.incident.severity === 'medium' ? 'text-orange-600' :
                            'text-yellow-600'
                          }`}>
                            {ni.incident.severity.toUpperCase()}
                          </span>
                          {' • '}
                          {ni.distance < 1000 
                            ? `${Math.round(ni.distance)}m away`
                            : `${(ni.distance / 1000).toFixed(1)}km away`
                          }
                          {ni.clusterMultiplier > 1.0 && (
                            <span className="text-red-600 font-semibold">
                              {' • '}Density: {ni.clusterMultiplier.toFixed(1)}x
                            </span>
                          )}
                        </div>
                        {ni.incident.description && (
                          <div className="text-gray-500 mt-1 line-clamp-2">
                            {ni.incident.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safe route indicator */}
              {routeData.safety && routeData.safety.score >= 80 && (
                <div className="p-2 bg-green-100 border border-green-300 rounded-lg mb-3">
                  <p className="text-xs text-green-800 text-center font-semibold">
                    ✅ This route is considered safe to travel
                  </p>
                </div>
              )}

              <button
                onClick={clearRoute}
                className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold shadow-md"
              >
                🗑️ Clear Route
              </button>
            </div>
          )}

          {/* Safety settings */}
          <div className="space-y-4 bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-lg text-gray-800">🛡️ Safety Settings</h3>
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
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
              >
                {isLoadingReports ? "⏳" : "🔄"} Refresh
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <label className="text-sm font-semibold text-blue-900 block">🛡️ Safety-First Routing</label>
                <p className="text-xs text-blue-700 mt-1">Find safest route, not shortest</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={safetySettings.safetyMode}
                  onChange={(e) => {
                    updateSafetySettings({ safetyMode: e.target.checked });
                    // Recalculate route if one exists
                    if (routeData && currentLocation && selectedDestination) {
                      getRoute(currentLocation, selectedDestination);
                    }
                  }}
                  className="sr-only peer"
                  title="Toggle safety mode"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Total Risk Count */}
          <div className="mt-6 pt-6 border-t">
            {isLoadingReports ? (
              <div className="text-center py-4 text-sm text-gray-500">Loading reports...</div>
            ) : harassmentIncidents.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">No incidents reported yet</div>
            ) : (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border-2 border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      ⚠️
                    </div>
                    <span className="text-lg font-bold text-gray-800">Total Risk Areas</span>
                  </div>
                  <span className="text-3xl font-bold text-red-600">{harassmentIncidents.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-7xl max-h-screen p-4 animate-scaleIn">
            {/* Close Button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200 flex items-center gap-2 bg-black bg-opacity-50 px-4 py-2 rounded-lg backdrop-blur-sm"
            >
              <span className="text-sm font-medium">Close</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image */}
            <img
              src={previewImage}
              alt="Evidence preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Watermark */}
            <div className="absolute bottom-8 left-8 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
              <p className="text-xs font-medium">🔒 Evidence Photo - Nirbhaya Platform</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MyMap;
