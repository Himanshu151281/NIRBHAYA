"use client";

import Nav from "@/components/custom/Nav";
import { useEffect, useState } from "react";
import Map, { Marker, NavigationControl, GeolocateControl, Layer, Source, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

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
  votes?: {
    upvotes: number;
    downvotes: number;
    credibility_score: number;
    total_votes: number;
  };
}

interface SafetySettings {
  safetyMode: boolean;
  showIncidents: boolean;
  safetyBuffer: number;
}

// Nearby Incidents Settings Interface
interface NearbyIncidentsSettings {
  useCustomLocation: boolean;
  customLocation: {lat: number; lng: number} | null;
  radiusKm: number;
  sortBy: 'time' | 'severity' | 'distance';
  isPickingLocation: boolean;
}

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
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Google Maps style From/To search state
  const [startLocation, setStartLocation] = useState<CustomDestination | null>(null);
  const [startQuery, setStartQuery] = useState("");
  const [startSearchResults, setStartSearchResults] = useState<any[]>([]);
  const [useCurrentAsStart, setUseCurrentAsStart] = useState(true);
  const [activeSearchField, setActiveSearchField] = useState<'start' | 'end' | null>(null);
  const [pickingLocationFor, setPickingLocationFor] = useState<'start' | 'end' | null>(null);
  
  // Nearby Incidents Feature State
  const [nearbySettings, setNearbySettings] = useState<NearbyIncidentsSettings>({
    useCustomLocation: false,
    customLocation: null,
    radiusKm: 5,
    sortBy: 'distance',
    isPickingLocation: false,
  });
  const [nearbyIncidents, setNearbyIncidents] = useState<(HarassmentIncident & { distanceKm: number })[]>([]);
  
  // Voting state
  const [userVotes, setUserVotes] = useState<Record<string, 'upvote' | 'downvote'>>({});
  const [votingIncidentId, setVotingIncidentId] = useState<string | null>(null);

  // Generate or get user ID from localStorage (for simple duplicate prevention)
  const getUserId = () => {
    if (typeof window === 'undefined') return 'anonymous';
    let userId = localStorage.getItem('nirbhaya_user_id');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('nirbhaya_user_id', userId);
    }
    return userId;
  };

  // Load saved votes from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVotes = localStorage.getItem('nirbhaya_votes');
      if (savedVotes) {
        setUserVotes(JSON.parse(savedVotes));
      }
    }
  }, []);

  // Handle voting on an incident
  const handleVote = async (incidentId: string, voteType: 'upvote' | 'downvote', e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent clicking through to incident
    
    const referenceLocation = nearbySettings.useCustomLocation && nearbySettings.customLocation
      ? nearbySettings.customLocation
      : currentLocation;
    
    if (!referenceLocation) {
      alert('📍 Location required to vote. Please enable location access.');
      return;
    }
    
    // Check if user already voted the same way
    if (userVotes[incidentId] === voteType) {
      alert(`You've already ${voteType}d this incident.`);
      return;
    }
    
    setVotingIncidentId(incidentId);
    
    try {
      const userId = getUserId();
      const response = await fetch(
        `http://localhost:8000/api/incidents/vote/${incidentId}?vote_type=${voteType}&user_id=${userId}&user_lat=${referenceLocation.lat}&user_lng=${referenceLocation.lng}&max_distance_km=${nearbySettings.radiusKm}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'Failed to vote');
      }
      
      const data = await response.json();
      
      // Update local vote record
      const newVotes = { ...userVotes, [incidentId]: voteType };
      setUserVotes(newVotes);
      localStorage.setItem('nirbhaya_votes', JSON.stringify(newVotes));
      
      // Update the incident's vote counts in state
      setHarassmentIncidents(prev => prev.map(incident => {
        if (String(incident.id) === incidentId) {
          return {
            ...incident,
            votes: data.votes
          };
        }
        return incident;
      }));
      
      // Also update nearbyIncidents
      setNearbyIncidents(prev => prev.map(incident => {
        if (String(incident.id) === incidentId) {
          return {
            ...incident,
            votes: data.votes
          };
        }
        return incident;
      }));
      
    } catch (error) {
      console.error('Vote error:', error);
      alert(`❌ ${error instanceof Error ? error.message : 'Failed to vote'}`);
    } finally {
      setVotingIncidentId(null);
    }
  };

  // Ensure map only renders on client side
  useEffect(() => {
    setIsMapReady(true);
  }, []);

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
                votes: report.votes || { upvotes: 0, downvotes: 0, credibility_score: 100, total_votes: 0 },
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
  const handleSearch = async (query: string, isStartSearch: boolean = false) => {
    if (!query.trim() || !MAPBOX_TOKEN) {
      if (isStartSearch) {
        setStartSearchResults([]);
      } else {
        setSearchResults([]);
      }
      return;
    }
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=IN&limit=5`
      );
      const data = await response.json();
      if (isStartSearch) {
        setStartSearchResults(data.features || []);
      } else {
        setSearchResults(data.features || []);
      }
    } catch (error) {
      console.error("Search error:", error);
      if (isStartSearch) {
        setStartSearchResults([]);
      } else {
        setSearchResults([]);
      }
    }
  };

  // Handle start location selection
  const handleSelectStartLocation = (place: any) => {
    const [lng, lat] = place.center;
    const start: CustomDestination = {
      lat,
      lng,
      name: place.text,
      address: place.place_name,
    };
    setStartLocation(start);
    setStartQuery(place.place_name);
    setStartSearchResults([]);
    setUseCurrentAsStart(false);
    setActiveSearchField(null);
    setViewport({ ...viewport, longitude: lng, latitude: lat, zoom: 14 });
    
    // Get route if we have destination
    if (selectedDestination) {
      getRoute(start, selectedDestination);
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
    setActiveSearchField(null);
    setViewport({ ...viewport, longitude: lng, latitude: lat, zoom: 14 });
    
    // Get route - use custom start location or current location
    const startPoint = useCurrentAsStart ? currentLocation : startLocation;
    if (startPoint) {
      getRoute(startPoint, destination);
    }
  };

  // Swap start and destination
  const swapLocations = () => {
    if (!selectedDestination) return;
    
    const tempDest = selectedDestination;
    const tempDestQuery = searchQuery;
    
    if (useCurrentAsStart && currentLocation) {
      // Swap current location with destination
      setStartLocation(tempDest);
      setStartQuery(tempDestQuery);
      setUseCurrentAsStart(false);
      
      // Make destination the current location
      setSelectedDestination({
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        name: "Current Location",
        address: "Your current location"
      });
      setSearchQuery("Current Location");
      
      // Recalculate route
      getRoute(tempDest, {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        name: "Current Location",
        address: "Your current location"
      });
    } else if (startLocation) {
      // Swap custom start with destination
      setSelectedDestination(startLocation);
      setSearchQuery(startQuery);
      setStartLocation(tempDest);
      setStartQuery(tempDestQuery);
      
      // Recalculate route
      getRoute(tempDest, startLocation);
    }
  };

  // Use current location as start
  const useCurrentLocation = () => {
    setUseCurrentAsStart(true);
    setStartLocation(null);
    setStartQuery("");
    setStartSearchResults([]);
    
    // Recalculate route if destination exists
    if (currentLocation && selectedDestination) {
      getRoute(currentLocation, selectedDestination);
    }
  };

  // ============================================
  // INCIDENT AVOIDANCE ROUTING - WORKING IMPLEMENTATION
  // Mapbox doesn't support custom exclusion polygons, so we:
  // 1. Get multiple route alternatives
  // 2. REJECT routes that pass through danger zones
  // 3. If all routes unsafe, inject waypoints to force avoidance
  // ============================================

  // Check if a route passes through any danger zone
  const routePassesThroughDanger = (
    routeCoordinates: [number, number][],
    incidents: HarassmentIncident[]
  ): { passes: boolean; violatingIncidents: HarassmentIncident[] } => {
    const violatingIncidents: HarassmentIncident[] = [];

    for (const incident of incidents) {
      const dangerRadius = getSeverityRadius(incident.severity);
      
      // Sample route points (every 5th point for performance)
      for (let i = 0; i < routeCoordinates.length; i += 5) {
        const [lng, lat] = routeCoordinates[i];
        const distance = calculateDistance(lat, lng, incident.lat, incident.lng);
        
        if (distance < dangerRadius) {
          if (!violatingIncidents.find(v => v.id === incident.id)) {
            violatingIncidents.push(incident);
          }
          break; // Found violation for this incident, move to next
        }
      }
    }

    return { passes: violatingIncidents.length > 0, violatingIncidents };
  };

  // Calculate avoidance waypoint - perpendicular offset from incident
  const calculateAvoidanceWaypoint = (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    incident: HarassmentIncident
  ): { lat: number; lng: number } => {
    const dangerRadius = getSeverityRadius(incident.severity);
    const avoidanceDistance = dangerRadius * 2.5; // Go 2.5x the danger radius away

    // Calculate direction from start to end
    const dx = end.lng - start.lng;
    const dy = end.lat - start.lat;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Perpendicular direction (rotate 90 degrees)
    const perpX = -dy / length;
    const perpY = dx / length;

    // Convert distance to degrees (approximate)
    const latOffset = (avoidanceDistance / 111320) * perpY;
    const lngOffset = (avoidanceDistance / (111320 * Math.cos(incident.lat * Math.PI / 180))) * perpX;

    // Determine which side to offset (away from the route line)
    // Use the side that's further from both start and end
    const waypoint1 = { lat: incident.lat + latOffset, lng: incident.lng + lngOffset };
    const waypoint2 = { lat: incident.lat - latOffset, lng: incident.lng - lngOffset };

    const dist1 = Math.min(
      calculateDistance(waypoint1.lat, waypoint1.lng, start.lat, start.lng),
      calculateDistance(waypoint1.lat, waypoint1.lng, end.lat, end.lng)
    );
    const dist2 = Math.min(
      calculateDistance(waypoint2.lat, waypoint2.lng, start.lat, start.lng),
      calculateDistance(waypoint2.lat, waypoint2.lng, end.lat, end.lng)
    );

    return dist1 > dist2 ? waypoint1 : waypoint2;
  };

  // Main routing function with TRUE incident avoidance
  const getRoute = async (start: {lat: number; lng: number}, end: CustomDestination) => {
    try {
      const dangerousIncidents = harassmentIncidents.filter(
        i => i.severity === 'high' || i.severity === 'medium'
      );

      console.log(`🗺️ Requesting routes (${dangerousIncidents.length} danger zones to avoid)...`);

      // ============================================
      // PHASE 1: Get initial routes from Mapbox
      // ============================================
      const baseUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${start.lng},${start.lat};${end.lng},${end.lat}` +
        `?geometries=geojson&alternatives=true&steps=true&access_token=${MAPBOX_TOKEN}`;

      const response = await fetch(baseUrl);
      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        console.error("❌ No routes found");
        return;
      }

      if (!safetySettings.safetyMode || dangerousIncidents.length === 0) {
        // Safety mode off - use shortest route
        setRouteData(data.routes[0]);
        return;
      }

      // ============================================
      // PHASE 2: Filter out routes that pass through danger zones
      // ============================================
      console.log("🔍 Checking routes against danger zones...");
      
      const safeRoutes: any[] = [];
      const unsafeRoutes: any[] = [];

      for (const route of data.routes) {
        const { passes, violatingIncidents } = routePassesThroughDanger(
          route.geometry.coordinates,
          dangerousIncidents
        );

        if (!passes) {
          const safety = calculateRouteSafety(route.geometry.coordinates);
          safeRoutes.push({ ...route, safety, isSafe: true });
          console.log(`  ✅ Route ${safeRoutes.length}: SAFE - ${(route.distance / 1000).toFixed(1)}km`);
        } else {
          unsafeRoutes.push({ route, violatingIncidents });
          console.log(`  ❌ Route passes through ${violatingIncidents.length} danger zone(s)`);
        }
      }

      // ============================================
      // PHASE 3: If safe route exists, use it
      // ============================================
      if (safeRoutes.length > 0) {
        // Sort by safety score
        safeRoutes.sort((a, b) => b.safety.score - a.safety.score);
        const bestRoute = safeRoutes[0];
        console.log(`🛡️ Selected safe route: Safety ${bestRoute.safety.score}/100, Distance ${(bestRoute.distance / 1000).toFixed(1)}km`);
        setRouteData(bestRoute);
        return;
      }

      // ============================================
      // PHASE 4: All routes unsafe - inject waypoints to force avoidance
      // ============================================
      console.log("⚠️ All routes pass through danger zones - generating avoidance route...");

      // Get the most problematic incidents from the shortest route
      const shortestUnsafe = unsafeRoutes[0];
      const incidentsToAvoid = shortestUnsafe.violatingIncidents.slice(0, 3); // Max 3 waypoints

      // Calculate avoidance waypoints
      const waypoints = incidentsToAvoid.map((incident: HarassmentIncident) => 
        calculateAvoidanceWaypoint(start, { lat: end.lat, lng: end.lng }, incident)
      );

      // Sort waypoints by distance from start
      waypoints.sort((a: {lat: number; lng: number}, b: {lat: number; lng: number}) => {
        const distA = calculateDistance(start.lat, start.lng, a.lat, a.lng);
        const distB = calculateDistance(start.lat, start.lng, b.lat, b.lng);
        return distA - distB;
      });

      console.log(`🔀 Adding ${waypoints.length} avoidance waypoint(s):`);
      waypoints.forEach((wp: {lat: number; lng: number}, i: number) => {
        console.log(`   ${i + 1}. [${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}]`);
      });

      // Build route with waypoints
      const waypointsStr = waypoints.map((wp: {lat: number; lng: number}) => `${wp.lng},${wp.lat}`).join(';');
      const avoidanceUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${start.lng},${start.lat};${waypointsStr};${end.lng},${end.lat}` +
        `?geometries=geojson&alternatives=false&steps=true&access_token=${MAPBOX_TOKEN}`;

      const avoidanceResponse = await fetch(avoidanceUrl);
      const avoidanceData = await avoidanceResponse.json();

      if (avoidanceData.routes && avoidanceData.routes.length > 0) {
        const avoidanceRoute = avoidanceData.routes[0];
        
        // Verify the new route is actually safe
        const { passes, violatingIncidents } = routePassesThroughDanger(
          avoidanceRoute.geometry.coordinates,
          dangerousIncidents
        );

        if (!passes) {
          const safety = calculateRouteSafety(avoidanceRoute.geometry.coordinates);
          console.log(`✅ Avoidance route successful: Safety ${safety.score}/100, Distance ${(avoidanceRoute.distance / 1000).toFixed(1)}km`);
          setRouteData({ ...avoidanceRoute, safety, isSafe: true, usedWaypoints: true });
        } else {
          // Still unsafe - use least bad route with warning
          console.warn(`⚠️ Could not find fully safe route. Showing least dangerous option.`);
          const safety = calculateRouteSafety(avoidanceRoute.geometry.coordinates);
          setRouteData({ 
            ...avoidanceRoute, 
            safety: { ...safety, warnings: [`⚠️ Route passes near ${violatingIncidents.length} incident(s) - proceed with caution`] },
            isSafe: false 
          });
        }
      } else {
        // Fallback to original shortest route with warning
        console.warn("⚠️ Avoidance routing failed - using original route with warnings");
        const originalRoute = data.routes[0];
        const safety = calculateRouteSafety(originalRoute.geometry.coordinates);
        setRouteData({ 
          ...originalRoute, 
          safety: { ...safety, warnings: ["⚠️ Could not avoid all danger zones - proceed with caution"] },
          isSafe: false 
        });
      }

    } catch (error) {
      console.error("Route error:", error);
    }
  };

  const clearRoute = () => {
    setRouteData(null);
    setSelectedDestination(null);
    setSearchQuery("");
    setStartLocation(null);
    setStartQuery("");
    setUseCurrentAsStart(true);
    setStartSearchResults([]);
    setSearchResults([]);
    setPickingLocationFor(null);
    setActiveSearchField(null);
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

  // ============================================
  // INCIDENT EXCLUSION POLYGON HELPERS
  // ============================================

  // Create circular polygon coordinates around an incident point
  const createExclusionPolygon = (
    lat: number,
    lng: number,
    radiusMeters: number,
    points: number = 12
  ): [number, number][] => {
    const coordinates: [number, number][] = [];
    const earthRadius = 6371000; // meters

    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dLat = (radiusMeters / earthRadius) * Math.cos(angle) * (180 / Math.PI);
      const dLng = (radiusMeters / (earthRadius * Math.cos(lat * Math.PI / 180))) *
                   Math.sin(angle) * (180 / Math.PI);
      coordinates.push([lng + dLng, lat + dLat]);
    }

    return coordinates;
  };

  // Encode polygon to Mapbox polyline format
  const encodePolyline = (coordinates: [number, number][]): string => {
    let encoded = '';
    let prevLat = 0;
    let prevLng = 0;

    coordinates.forEach(([lng, lat]) => {
      // Mapbox uses [lat, lng] order for polyline encoding
      const latE5 = Math.round(lat * 1e5);
      const lngE5 = Math.round(lng * 1e5);

      const dLat = latE5 - prevLat;
      const dLng = lngE5 - prevLng;

      prevLat = latE5;
      prevLng = lngE5;

      encoded += encodeNumber(dLat) + encodeNumber(dLng);
    });

    return encoded;
  };

  // Helper to encode a single number for polyline
  const encodeNumber = (num: number): string => {
    let value = num < 0 ? ~(num << 1) : (num << 1);
    let encoded = '';
    
    while (value >= 0x20) {
      encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }
    encoded += String.fromCharCode(value + 63);
    
    return encoded;
  };

  // Calculate distance from a point to a line segment (for prioritizing incidents on route path)
  const pointToLineDistance = (
    point: { lat: number; lng: number },
    lineStart: { lat: number; lng: number },
    lineEnd: { lat: number; lng: number }
  ): number => {
    const A = point.lat - lineStart.lat;
    const B = point.lng - lineStart.lng;
    const C = lineEnd.lat - lineStart.lat;
    const D = lineEnd.lng - lineStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = lineStart.lat;
      yy = lineStart.lng;
    } else if (param > 1) {
      xx = lineEnd.lat;
      yy = lineEnd.lng;
    } else {
      xx = lineStart.lat + param * C;
      yy = lineStart.lng + param * D;
    }

    return calculateDistance(point.lat, point.lng, xx, yy);
  };

  // Select the most critical incidents to exclude (Mapbox limit: 3 polygons)
  const selectCriticalExclusions = (
    incidents: HarassmentIncident[],
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ): HarassmentIncident[] => {
    return incidents
      .map(incident => {
        // Distance from incident to the direct line between start and end
        const distanceToRoute = pointToLineDistance(incident, start, end);

        // Severity weight (higher = more critical)
        const severityWeight = incident.severity === 'high' ? 100 :
                               incident.severity === 'medium' ? 50 : 10;

        // Priority: high severity + close to route = high priority
        const priority = severityWeight / (distanceToRoute + 100); // +100 to avoid division issues

        return { ...incident, priority };
      })
      .sort((a, b) => (b as any).priority - (a as any).priority)
      .slice(0, 3); // Mapbox limit: max 3 exclusion polygons
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

  // Calculate nearby incidents based on settings (for the Nearby Incidents feature)
  useEffect(() => {
    const referenceLocation = nearbySettings.useCustomLocation && nearbySettings.customLocation
      ? nearbySettings.customLocation
      : currentLocation;

    if (!referenceLocation || harassmentIncidents.length === 0) {
      setNearbyIncidents([]);
      return;
    }

    // Calculate distance for each incident and filter by radius
    const incidentsWithDistance = harassmentIncidents
      .map((incident) => {
        const distanceMeters = calculateDistance(
          referenceLocation.lat,
          referenceLocation.lng,
          incident.lat,
          incident.lng
        );
        const distanceKm = distanceMeters / 1000;
        return { ...incident, distanceKm };
      })
      .filter((incident) => incident.distanceKm <= nearbySettings.radiusKm);

    // Sort incidents based on selected criteria
    const sortedIncidents = [...incidentsWithDistance].sort((a, b) => {
      switch (nearbySettings.sortBy) {
        case 'distance':
          return a.distanceKm - b.distanceKm;
        case 'severity':
          const severityOrder = { high: 0, medium: 1, low: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        case 'time':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return a.distanceKm - b.distanceKm;
      }
    });

    setNearbyIncidents(sortedIncidents);
  }, [nearbySettings, currentLocation, harassmentIncidents]);

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
      <div className="flex flex-1 relative mt-24">
        {/* Map */}
        <div className="flex-1">
          {isMapReady ? (
            <Map
              {...viewport}
              onMove={(evt) => setViewport(evt.viewState)}
              onClick={async (evt) => {
                const { lng, lat } = evt.lngLat;
                
                // If picking route location (start or destination)
                if (pickingLocationFor) {
                  // Reverse geocode to get address
                  let placeName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                  try {
                    const response = await fetch(
                      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
                    );
                    const data = await response.json();
                    if (data.features && data.features.length > 0) {
                      placeName = data.features[0].place_name || placeName;
                    }
                  } catch (error) {
                    console.error("Reverse geocode error:", error);
                  }
                  
                  const location: CustomDestination = {
                    lat,
                    lng,
                    name: placeName.split(',')[0],
                    address: placeName,
                  };
                  
                  if (pickingLocationFor === 'start') {
                    setStartLocation(location);
                    setStartQuery(placeName);
                    setUseCurrentAsStart(false);
                    if (selectedDestination) {
                      getRoute(location, selectedDestination);
                    }
                  } else {
                    setSelectedDestination(location);
                    setSearchQuery(placeName);
                    const startPoint = useCurrentAsStart ? currentLocation : startLocation;
                    if (startPoint) {
                      getRoute(startPoint, location);
                    }
                  }
                  setPickingLocationFor(null);
                  return;
                }
                
                // If picking location for nearby incidents
                if (nearbySettings.isPickingLocation) {
                  setNearbySettings(prev => ({
                    ...prev,
                    customLocation: { lat, lng },
                    useCustomLocation: true,
                    isPickingLocation: false,
                  }));
                  console.log("📍 Custom location set:", { lat, lng });
                } else {
                  setSelectedIncident(null);
                }
              }}
              cursor={pickingLocationFor || nearbySettings.isPickingLocation ? 'crosshair' : 'grab'}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: "100%", height: "100%" }}
              onError={(e) => {
                // Suppress telemetry errors from ad blockers and worker errors
                const errorMsg = e.error?.message || String(e.error) || '';
                if (
                  errorMsg.includes('NetworkError') || 
                  errorMsg.includes('events.mapbox') ||
                  errorMsg.includes('send') ||
                errorMsg.includes('worker')
              ) {
                console.warn('Mapbox worker/telemetry issue (often caused by ad blockers). Map may still work.');
              } else {
                console.error('Map error:', errorMsg || e);
                setMapError(errorMsg);
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

            {/* Custom location marker for nearby incidents */}
            {nearbySettings.useCustomLocation && nearbySettings.customLocation && (
              <Marker
                longitude={nearbySettings.customLocation.lng}
                latitude={nearbySettings.customLocation.lat}
                anchor="center"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-purple-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold">
                    📍
                  </div>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-purple-600"></div>
                </div>
              </Marker>
            )}

            {/* Radius circle visualization */}
            {(() => {
              const center = nearbySettings.useCustomLocation && nearbySettings.customLocation
                ? nearbySettings.customLocation
                : currentLocation;
              if (!center) return null;
              
              // Create a circle polygon for the radius
              const points = 64;
              const radiusInDegrees = nearbySettings.radiusKm / 111; // rough conversion
              const coordinates = [];
              for (let i = 0; i <= points; i++) {
                const angle = (i / points) * 2 * Math.PI;
                const lng = center.lng + radiusInDegrees * Math.cos(angle) / Math.cos(center.lat * Math.PI / 180);
                const lat = center.lat + radiusInDegrees * Math.sin(angle);
                coordinates.push([lng, lat]);
              }
              
              return (
                <Source
                  id="radius-circle"
                  type="geojson"
                  data={{
                    type: "Feature",
                    properties: {},
                    geometry: {
                      type: "Polygon",
                      coordinates: [coordinates],
                    },
                  }}
                >
                  <Layer
                    id="radius-fill"
                    type="fill"
                    paint={{
                      "fill-color": "#8b5cf6",
                      "fill-opacity": 0.1,
                    }}
                  />
                  <Layer
                    id="radius-outline"
                    type="line"
                    paint={{
                      "line-color": "#8b5cf6",
                      "line-width": 2,
                      "line-dasharray": [3, 2],
                    }}
                  />
                </Source>
              );
            })()}

            {/* Custom start location marker (when not using GPS) */}
            {!useCurrentAsStart && startLocation && (
              <Marker
                longitude={startLocation.lng}
                latitude={startLocation.lat}
                anchor="bottom"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-green-500"></div>
                </div>
              </Marker>
            )}

            {/* Selected destination marker */}
            {selectedDestination && (
              <Marker
                longitude={selectedDestination.lng}
                latitude={selectedDestination.lat}
                anchor="bottom"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-red-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">B</span>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-red-500"></div>
                </div>
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
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-purple-600 font-medium">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="w-96 bg-white shadow-2xl overflow-y-auto p-4 border-r border-purple-100 h-[calc(100vh-6rem)]">
          <h2 className="text-xl font-bold mb-3">Safe Route Finder</h2>

          {/* Current Location Display */}
          <div className="mb-3 p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">📍 GPS:</span>
                {currentLocation ? (
                  <span className="text-xs text-gray-600">
                    {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">Loading...</span>
                )}
              </div>
              <button
                onClick={() => {
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
                      },
                      (error) => {
                        alert("Location error: " + error.message);
                      },
                      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                    );
                  }
                }}
                className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full hover:shadow-lg transition-all"
              >
                🔄
              </button>
            </div>
          </div>

          {/* Google Maps Style From/To Search */}
          <div className="mb-4 bg-white rounded-xl shadow-lg border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 flex items-center justify-between rounded-t-xl">
              <h3 className="text-white font-semibold text-sm">🗺️ Plan Your Safe Route</h3>
              {pickingLocationFor && (
                <span className="text-white text-xs bg-white/20 px-2 py-1 rounded-full">
                  Click map to set {pickingLocationFor === 'start' ? 'start' : 'destination'}
                </span>
              )}
            </div>
            
            <div className="p-3 space-y-2">
              {/* FROM Location */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <input
                    type="text"
                    value={useCurrentAsStart ? "📍 Your Location" : startQuery}
                    onChange={(e) => {
                      setStartQuery(e.target.value);
                      setUseCurrentAsStart(false);
                      handleSearch(e.target.value, true);
                      setActiveSearchField('start');
                    }}
                    onFocus={() => setActiveSearchField('start')}
                    placeholder="Starting point..."
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      useCurrentAsStart ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200'
                    }`}
                  />
                  <button
                    onClick={() => {
                      setPickingLocationFor('start');
                      setActiveSearchField(null);
                    }}
                    className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                      pickingLocationFor === 'start' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
                    }`}
                    title="Select on map"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                
                {/* Quick actions for start */}
                {!useCurrentAsStart && currentLocation && (
                  <button
                    onClick={useCurrentLocation}
                    className="ml-8 mt-1 text-xs text-green-600 hover:text-green-700"
                  >
                    📍 Use my location
                  </button>
                )}
                
                {/* Start search results */}
                {activeSearchField === 'start' && startSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 z-[100] border rounded-lg shadow-xl max-h-48 overflow-y-auto bg-white">
                    {startSearchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectStartLocation(result)}
                        className="px-3 py-2 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium text-sm">{result.text}</div>
                        <div className="text-xs text-gray-500 truncate">{result.place_name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap Button - centered line */}
              <div className="flex items-center justify-center py-1">
                <div className="flex-1 h-px bg-gray-200"></div>
                <button
                  onClick={swapLocations}
                  disabled={!selectedDestination}
                  className={`mx-2 p-1.5 rounded-full border transition-all ${
                    selectedDestination 
                      ? 'bg-white border-purple-300 hover:bg-purple-50 cursor-pointer' 
                      : 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                  }`}
                  title="Swap locations"
                >
                  <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* TO Location */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">B</span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value, false);
                      setActiveSearchField('end');
                    }}
                    onFocus={() => setActiveSearchField('end')}
                    placeholder="Where to?"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => {
                      setPickingLocationFor('end');
                      setActiveSearchField(null);
                    }}
                    className={`p-2 rounded-lg transition-all flex-shrink-0 ${
                      pickingLocationFor === 'end' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                    }`}
                    title="Select on map"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                
                {/* Destination search results */}
                {activeSearchField === 'end' && searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 z-[100] border rounded-lg shadow-xl max-h-48 overflow-y-auto bg-white">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectDestination(result)}
                        className="px-3 py-2 hover:bg-purple-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium text-sm">{result.text}</div>
                        <div className="text-xs text-gray-500 truncate">{result.place_name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Route Button */}
              {routeData && (
                <button
                  onClick={clearRoute}
                  className="w-full py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-all font-medium border border-red-200"
                >
                  ✕ Clear Route
                </button>
              )}
            </div>
          </div>

          {/* Route info with safety analysis */}
          {routeData && (
            <div className="mb-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-gray-800">
                  {safetySettings.safetyMode ? '🛡️ Safe Route' : '🚗 Route'}
                </h3>
                {routeData.safety && (
                  <div className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                    routeData.safety.score >= 80 ? 'bg-green-500 text-white' :
                    routeData.safety.score >= 60 ? 'bg-yellow-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {routeData.safety.score}/100
                  </div>
                )}
              </div>

              <div className="flex gap-4 text-xs mb-2">
                <span><strong>{(routeData.distance / 1000).toFixed(1)}</strong> km</span>
                <span><strong>{Math.round(routeData.duration / 60)}</strong> min</span>
              </div>

              {/* Safety warnings */}
              {routeData.safety && routeData.safety.warnings.length > 0 && (
                <div className="p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded text-xs mb-2">
                  <p className="font-semibold text-yellow-800 mb-1">⚠️ Alerts:</p>
                  <ul className="space-y-0.5 text-yellow-700">
                    {routeData.safety.warnings.slice(0, 3).map((warning: string, idx: number) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nearby incidents details */}
              {routeData.safety && routeData.safety.nearbyIncidents.length > 0 && (
                <div className="p-2 bg-white border border-gray-200 rounded text-xs">
                  <p className="font-semibold text-gray-800 mb-1">📍 {routeData.safety.nearbyIncidents.length} Incidents Near Route</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {routeData.safety.nearbyIncidents.slice(0, 5).map((ni: any, idx: number) => (
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

          {/* Nearby Incidents Feature */}
          <div className="mt-3 space-y-2 bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-purple-900">🔍 Nearby Incidents</h3>
              <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full font-semibold">
                {nearbyIncidents.length}
              </span>
            </div>

            {/* Location Mode Toggle */}
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setNearbySettings(prev => ({ ...prev, useCustomLocation: false, isPickingLocation: false }));
                }}
                className={`flex-1 px-2 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  !nearbySettings.useCustomLocation
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-purple-700 border border-purple-300'
                }`}
              >
                🎯 GPS
              </button>
              <button
                onClick={() => {
                  setNearbySettings(prev => ({ ...prev, isPickingLocation: true }));
                }}
                className={`flex-1 px-2 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  nearbySettings.isPickingLocation
                    ? 'bg-orange-500 text-white animate-pulse'
                    : nearbySettings.useCustomLocation
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-purple-700 border border-purple-300'
                }`}
              >
                {nearbySettings.isPickingLocation ? '👆 Click...' : '📌 Custom'}
              </button>
            </div>

            {/* Custom location display */}
            {nearbySettings.useCustomLocation && nearbySettings.customLocation && (
              <div className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-lg">
                📍 {nearbySettings.customLocation.lat.toFixed(4)}, {nearbySettings.customLocation.lng.toFixed(4)}
              </div>
            )}

            {/* Radius Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="radius-slider" className="text-xs font-semibold text-purple-900">📏 Radius</label>
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {nearbySettings.radiusKm} km
                </span>
              </div>
              <input
                id="radius-slider"
                type="range"
                min="1"
                max="20"
                value={nearbySettings.radiusKm}
                onChange={(e) => setNearbySettings(prev => ({ ...prev, radiusKm: Number(e.target.value) }))}
                className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                title={`Search radius: ${nearbySettings.radiusKm} km`}
              />
            </div>

            {/* Sort Options - Compact */}
            <div className="flex gap-1">
              {[
                { key: 'distance', label: '📍' },
                { key: 'severity', label: '⚠️' },
                { key: 'time', label: '🕐' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setNearbySettings(prev => ({ ...prev, sortBy: key as 'distance' | 'severity' | 'time' }))}
                  title={`Sort by ${key}`}
                  className={`flex-1 px-2 py-1 text-xs rounded-lg font-medium transition-all ${
                    nearbySettings.sortBy === key
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-purple-700 border border-purple-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Nearby Incidents List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {!currentLocation && !nearbySettings.customLocation ? (
                <div className="text-center py-2 text-xs text-purple-500">
                  📍 Waiting for location...
                </div>
              ) : nearbyIncidents.length === 0 ? (
                <div className="text-center py-2">
                  <div className="text-xl">✅</div>
                  <div className="text-xs text-green-600 font-medium">No incidents within {nearbySettings.radiusKm} km</div>
                </div>
              ) : (
                nearbyIncidents.map((incident, idx) => (
                  <div
                    key={incident.id}
                    onClick={() => {
                      setSelectedIncident(incident);
                      setViewport({
                        longitude: incident.lng,
                        latitude: incident.lat,
                        zoom: 16
                      });
                    }}
                    className={`p-2 rounded-lg cursor-pointer transition-all hover:shadow-sm border-l-3 ${
                      incident.severity === 'high'
                        ? 'bg-red-50 border-red-500'
                        : incident.severity === 'medium'
                          ? 'bg-orange-50 border-orange-500'
                          : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            incident.severity === 'high'
                              ? 'bg-red-500 text-white'
                              : incident.severity === 'medium'
                                ? 'bg-orange-500 text-white'
                                : 'bg-yellow-500 text-white'
                          }`}>
                            {incident.severity.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-gray-500">{incident.date}</span>
                          {incident.votes && incident.votes.total_votes > 0 && (
                            <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${
                              incident.votes.credibility_score >= 70 
                                ? 'bg-green-100 text-green-700' 
                                : incident.votes.credibility_score >= 40 
                                  ? 'bg-yellow-100 text-yellow-700' 
                                  : 'bg-red-100 text-red-700'
                            }`}>
                              {incident.votes.credibility_score}%
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-semibold text-gray-800 line-clamp-1 mt-0.5">
                          {incident.title || 'Incident'}
                        </h4>
                        
                        {/* Compact Voting */}
                        <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleVote(String(incident.id), 'upvote', e)}
                            disabled={votingIncidentId === String(incident.id)}
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              userVotes[String(incident.id)] === 'upvote'
                                ? 'bg-green-500 text-white'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            👍 {incident.votes?.upvotes || 0}
                          </button>
                          <button
                            onClick={(e) => handleVote(String(incident.id), 'downvote', e)}
                            disabled={votingIncidentId === String(incident.id)}
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              userVotes[String(incident.id)] === 'downvote'
                                ? 'bg-red-500 text-white'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            👎 {incident.votes?.downvotes || 0}
                          </button>
                        </div>
                      </div>
                      <div className="text-right ml-1">
                        <div className="text-xs font-bold text-purple-600">
                          {incident.distanceKm < 1
                            ? `${Math.round(incident.distanceKm * 1000)}m`
                            : `${incident.distanceKm.toFixed(1)}km`
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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
