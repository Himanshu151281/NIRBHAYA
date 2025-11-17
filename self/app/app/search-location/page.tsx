"use client";

import Nav from "@/components/custom/Nav";
import {
  Autocomplete,
  Circle,
  DirectionsRenderer,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";

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
}

interface SafeRoute extends google.maps.DirectionsRoute {
  isSafe: boolean;
  name: string;
  originalIndex: number;
  optionIndex: number;
}

interface RouteOption {
  name: string;
  config: google.maps.DirectionsRequest;
}

interface SafetySettings {
  safetyMode: boolean;
  showIncidents: boolean;
  safetyBuffer: number;
}

// Sample harassment incident data - replace with your actual dataset
const harassmentIncidents: HarassmentIncident[] = [
  {
    id: 1,
    lat: 28.7041,
    lng: 77.1025,
    severity: "high",
    date: "2024-01-15",
    timeOfDay: "evening",
  },
  {
    id: 2,
    lat: 28.5355,
    lng: 77.291,
    severity: "medium",
    date: "2024-02-10",
    timeOfDay: "night",
  },
  {
    id: 3,
    lat: 28.52,
    lng: 77.28,
    severity: "high",
    date: "2024-01-20",
    timeOfDay: "afternoon",
  },
  {
    id: 4,
    lat: 28.54,
    lng: 77.3,
    severity: "low",
    date: "2024-03-01",
    timeOfDay: "morning",
  },
];

const MyMap: React.FC = () => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ["places", "geometry"],
  });

  const [currentLocation, setCurrentLocation] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({
    lat: 28.7041,
    lng: 77.1025,
  });
  const [selectedDestination, setSelectedDestination] =
    useState<CustomDestination | null>(null);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [safetySettings, setSafetySettings] = useState<SafetySettings>({
    safetyMode: true,
    showIncidents: true,
    safetyBuffer: 500, // meters
  });
  const [routeAlternatives, setRouteAlternatives] = useState<SafeRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Get live location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos: GeolocationPosition) => {
          const loc: google.maps.LatLngLiteral = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setCurrentLocation(loc);
          setMapCenter(loc);
        },
        (err: GeolocationPositionError) => console.error(err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Autocomplete handlers
  const onLoadAutocomplete = (
    autocomplete: google.maps.places.Autocomplete
  ) => {
    // Restrict suggestions to India
    autocomplete.setComponentRestrictions({ country: ["IN"] });
    // Bias suggestions to current viewport
    if (map) autocomplete.setBounds(map.getBounds()!);
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.geometry || !place.geometry.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    const newDestination: CustomDestination = {
      lat,
      lng,
      name: place.name || "Selected Location",
      address: place.formatted_address || "",
    };

    setSelectedDestination(newDestination);
    setMapCenter({ lat, lng });

    if (map) {
      map.panTo({ lat, lng });
      map.setZoom(15);
    }
  };

  // Check if a route passes through unsafe areas
  const isRouteSafe = (route: google.maps.DirectionsRoute): boolean => {
    if (!safetySettings.safetyMode || !google.maps) return true;

    const path = route.overview_path;

    for (const incident of harassmentIncidents) {
      for (const point of path) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          point,
          new google.maps.LatLng(incident.lat, incident.lng)
        );

        // Use the actual radius for each incident severity level
        const incidentRadius = getSeverityRadius(incident.severity);

        // If route passes within the incident's danger zone, it's unsafe
        if (distance <= incidentRadius) {
          console.log(
            `Route passes through ${
              incident.severity
            } risk area at distance: ${Math.round(distance)}m`
          );
          return false;
        }
      }
    }
    return true;
  };

  // Generate safe waypoints to avoid dangerous areas
  const generateSafeWaypoints = (
    origin: google.maps.LatLngLiteral,
    destination: google.maps.LatLngLiteral
  ): google.maps.LatLngLiteral[] => {
    if (!safetySettings.safetyMode || !google.maps) return [];

    const waypoints: google.maps.LatLngLiteral[] = [];
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;

    // Check if direct path passes through dangerous areas
    for (const incident of harassmentIncidents) {
      const distanceToIncident =
        google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(midLat, midLng),
          new google.maps.LatLng(incident.lat, incident.lng)
        );

      if (distanceToIncident <= safetySettings.safetyBuffer * 2) {
        // Create waypoint that deviates from dangerous area
        const angle = Math.random() * 2 * Math.PI;
        const offset = 0.005; // Approximately 500m offset

        waypoints.push({
          lat: midLat + Math.cos(angle) * offset,
          lng: midLng + Math.sin(angle) * offset,
        });
        break; // Only add one avoidance waypoint per route
      }
    }

    return waypoints;
  };

  // Calculate multiple routes with safety considerations
  useEffect(() => {
    if (currentLocation && selectedDestination && google.maps) {
      const service = new google.maps.DirectionsService();
      const routes: SafeRoute[] = [];

      // Generate different routing options
      const routingOptions: RouteOption[] = [
        {
          name: "Direct Route",
          config: {
            origin: currentLocation,
            destination: {
              lat: selectedDestination.lat,
              lng: selectedDestination.lng,
            },
            travelMode: google.maps.TravelMode.WALKING,
            provideRouteAlternatives: true,
          },
        },
      ];

      // Add safe route with waypoints if safety mode is on
      if (safetySettings.safetyMode) {
        const safeWaypoints = generateSafeWaypoints(
          currentLocation,
          selectedDestination
        );
        if (safeWaypoints.length > 0) {
          routingOptions.push({
            name: "Safe Route (Avoiding Incidents)",
            config: {
              origin: currentLocation,
              destination: {
                lat: selectedDestination.lat,
                lng: selectedDestination.lng,
              },
              travelMode: google.maps.TravelMode.WALKING,
              waypoints: safeWaypoints.map((wp) => ({
                location: wp,
                stopover: false,
              })),
              provideRouteAlternatives: false,
            },
          });
        }
      }

      // Process each routing option
      let processedRoutes = 0;

      routingOptions.forEach((option: RouteOption, index: number) => {
        service.route(
          option.config,
          (
            result: google.maps.DirectionsResult | null,
            status: google.maps.DirectionsStatus
          ) => {
            if (status === "OK" && result) {
              const routesWithSafety: SafeRoute[] = result.routes.map(
                (route, routeIndex) => ({
                  ...route,
                  isSafe: isRouteSafe(route),
                  name:
                    option.name +
                    (result.routes.length > 1
                      ? ` (Option ${routeIndex + 1})`
                      : ""),
                  originalIndex: routeIndex,
                  optionIndex: index,
                })
              );

              routes.push(...routesWithSafety);
            }

            processedRoutes++;
            if (processedRoutes === routingOptions.length) {
              // Sort routes by safety first, then by duration
              routes.sort((a: SafeRoute, b: SafeRoute) => {
                if (safetySettings.safetyMode && a.isSafe !== b.isSafe) {
                  return Number(b.isSafe) - Number(a.isSafe); // Safe routes first
                }
                return a.legs[0].duration!.value - b.legs[0].duration!.value; // Then by duration
              });

              setRouteAlternatives(routes);
              if (routes.length > 0) {
                const selectedRoute = routes[selectedRouteIndex] || routes[0];
                if (result) {
                  setDirections({
                    ...result,
                    routes: [selectedRoute],
                    request: result.request,
                  });
                }
              }
            }
          }
        );
      });
    }
  }, [
    selectedDestination,
    currentLocation,
    safetySettings.safetyMode,
    safetySettings.safetyBuffer,
    selectedRouteIndex,
    generateSafeWaypoints,
    isRouteSafe,
  ]);

  const selectRoute = (index: number): void => {
    setSelectedRouteIndex(index);
    if (routeAlternatives[index]) {
      // Create a directions result with the selected route
      setDirections({
        routes: [routeAlternatives[index]],
        request: {} as google.maps.DirectionsRequest,
      });
    }
  };

  const updateSafetySettings = (updates: Partial<SafetySettings>): void => {
    setSafetySettings((prev) => ({ ...prev, ...updates }));
  };

  const getSeverityColor = (
    severity: HarassmentIncident["severity"]
  ): string => {
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

  const getSeverityRadius = (
    severity: HarassmentIncident["severity"]
  ): number => {
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

  const formatDuration = (
    duration: google.maps.Duration | undefined
  ): string => {
    return duration ? duration.text : "N/A";
  };

  const formatDistance = (
    distance: google.maps.Distance | undefined
  ): string => {
    return distance ? distance.text : "N/A";
  };

  const clearRoute = () => {
    setDirections(null);
    setRouteAlternatives([]);
    setSelectedRouteIndex(0);
    setSelectedDestination(null);
  };

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <div className="flex flex-col h-screen">
      <Nav />
      <div className="flex flex-1 relative">
        {/* Map */}
        <div className="flex-1">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={mapCenter}
            zoom={14}
            onLoad={(mapInstance) => setMap(mapInstance)}
          >
            {/* Current location marker */}
            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                }}
                title="Your Location"
              />
            )}

            {/* Selected destination marker */}
            {selectedDestination && (
              <Marker
                position={{
                  lat: selectedDestination.lat,
                  lng: selectedDestination.lng,
                }}
                title={selectedDestination.name}
              />
            )}

            {/* Show harassment incident markers and danger zones */}
            {safetySettings.showIncidents &&
              harassmentIncidents.map((incident: HarassmentIncident) => (
                <div key={incident.id}>
                  <Marker
                    position={{ lat: incident.lat, lng: incident.lng }}
                    icon={{
                      url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    }}
                    title={`${incident.severity.toUpperCase()} risk incident`}
                  />
                  <Circle
                    center={{ lat: incident.lat, lng: incident.lng }}
                    radius={getSeverityRadius(incident.severity)}
                    options={{
                      fillColor: getSeverityColor(incident.severity),
                      fillOpacity: 0.2,
                      strokeColor: getSeverityColor(incident.severity),
                      strokeOpacity: 0.6,
                      strokeWeight: 2,
                    }}
                  />
                </div>
              ))}

            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>

          {/* Autocomplete Search Input */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <Autocomplete
              onLoad={onLoadAutocomplete}
              onPlaceChanged={onPlaceChanged}
            >
              <input
                type="text"
                placeholder="Search for a destination..."
                className="px-4 py-3 text-lg bg-white/80 rounded-lg shadow-lg w-96 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Autocomplete>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white shadow-lg border-l p-4 overflow-y-auto">
          {/* Safety Controls */}
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">Safety Settings</h3>

            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={safetySettings.safetyMode}
                onChange={(e) =>
                  updateSafetySettings({ safetyMode: e.target.checked })
                }
                className="mr-2"
              />
              Enable Safety Mode
            </label>

            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={safetySettings.showIncidents}
                onChange={(e) =>
                  updateSafetySettings({ showIncidents: e.target.checked })
                }
                className="mr-2"
              />
              Show Incident Areas
            </label>

            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">
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

          {selectedDestination ? (
            <>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h2 className="text-lg font-semibold text-blue-800 mb-1">
                  {selectedDestination.name}
                </h2>
                {selectedDestination.address && (
                  <p className="text-sm text-blue-600">
                    {selectedDestination.address}
                  </p>
                )}
              </div>

              {/* Route Alternatives */}
              {routeAlternatives.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-semibold mb-2">Route Options</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {routeAlternatives.map(
                      (route: SafeRoute, index: number) => (
                        <div
                          key={index}
                          className={`p-2 border rounded cursor-pointer ${
                            index === selectedRouteIndex
                              ? "bg-blue-100 border-blue-300"
                              : "hover:bg-gray-50"
                          } ${
                            route.isSafe
                              ? "border-l-4 border-l-green-500"
                              : "border-l-4 border-l-red-500"
                          }`}
                          onClick={() => selectRoute(index)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">
                                {route.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {formatDuration(route.legs[0]?.duration)} •{" "}
                                {formatDistance(route.legs[0]?.distance)}
                              </p>
                            </div>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                route.isSafe
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {route.isSafe ? "Safe" : "Caution"}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Safety Warning */}
              {safetySettings.safetyMode &&
                selectedRouteIndex < routeAlternatives.length &&
                !routeAlternatives[selectedRouteIndex]?.isSafe && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded">
                    <p className="text-xs text-yellow-800">
                      ⚠️ This route may pass near reported incident areas.
                      Consider using an alternative route.
                    </p>
                  </div>
                )}

              <button
                className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                onClick={clearRoute}
              >
                Clear Route
              </button>
            </>
          ) : (
            <div>
              <p className="text-gray-500 mb-4">
                Search for a destination using the search box above to get safe
                route options
              </p>

              {/* Instructions */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  How to use:
                </h3>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1. Use the search box to find your destination</li>
                  <li>2. Review route options with safety indicators</li>
                  <li>3. Choose the safest route for your journey</li>
                </ol>
              </div>

              {/* Legend */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Legend</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span>Your Location</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span>High Risk Area</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span>Medium Risk Area</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-300 mr-2"></div>
                    <span>Low Risk Area</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* <BottomBar /> */}
    </div>
  );
};

export default MyMap;
