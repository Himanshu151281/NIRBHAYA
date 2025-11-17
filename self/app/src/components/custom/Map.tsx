import {
  Autocomplete,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState } from "react";

const containerStyle = { width: "100%", height: "100vh" };

export default function MapUI() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const currentLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLocation(currentLocation);
        console.log("User current location:", currentLocation);
      });
    }
  }, []);

  const onPlaceChanged = () => {
    // put random location for testing
    const lat = 28.6139;
    const lng = 77.209;

    const newLocation = { lat, lng };
    setLocation(newLocation);
    console.log("Selected place location:", newLocation);

    if (map) {
      map.panTo(newLocation);
      map.setZoom(15);
    }
  };

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="w-full h-screen relative">
      {location && (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={location}
          zoom={15}
          onLoad={(mapInstance) => setMap(mapInstance)}
          options={{ disableDefaultUI: true }}
        >
          {/* Marker at the location */}
          <Marker position={location} />
        </GoogleMap>
      )}

      {/* Autocomplete Input */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
        <Autocomplete onPlaceChanged={onPlaceChanged}>
          <input
            type="text"
            placeholder="Search location..."
            className="px-6 py-4 text-xl rounded shadow-lg w-96"
          />
        </Autocomplete>
      </div>
    </div>
  );
}
