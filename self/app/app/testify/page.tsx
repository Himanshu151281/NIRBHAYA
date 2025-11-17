"use client";

import Nav from "@/components/custom/Nav"; // adjust path based on your structure
import { useNirbhaya } from "@/utils/useSwarContext";
import { useRouter } from "next/navigation"; // ✅ useRouter instead of useNavigate
import { useEffect, useRef, useState } from "react";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { api } from "@/lib/api";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function ReportIncident() {
  const { addReport } = useNirbhaya();

  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{
    lat: number | null;
    lng: number | null;
  }>({
    lat: null,
    lng: null,
  });
  const [locationMode, setLocationMode] = useState<"current" | "manual">("current");
  const [showMap, setShowMap] = useState(false);
  const [mapViewport, setMapViewport] = useState({
    longitude: 77.209,
    latitude: 28.6139,
    zoom: 12
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Ask location on load
  useEffect(() => {
    if (locationMode === "current") {
      console.log("🔍 Getting current location...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLocation(loc);
          setMapViewport({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude,
            zoom: 15
          });
          console.log("✅ Current location set:", loc);
        },
        (err) => {
          console.error("❌ Error getting location:", err);
          alert("Unable to get your location. Please select location manually.");
          setLocationMode("manual");
          setShowMap(true);
        }
      );
    }
  }, [locationMode]);

  // Start camera automatically
  useEffect(() => {
    startCamera();
    return stopCamera; // stop camera on unmount
  }, []);

  const startCamera = async () => {
    if (videoRef.current && !videoRef.current.srcObject) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access denied", err);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, 320, 240);

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `incident-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setPhotos((prev) => [...prev, file]);
        setPreviews((prev) => [...prev, URL.createObjectURL(blob)]);
      }
    }, "image/jpeg");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...filesArray]);
      setPreviews((prev) => [
        ...prev,
        ...filesArray.map((file) => URL.createObjectURL(file)),
      ]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Solution 1: Replace the problematic regex with ES5+ compatible version
  function extractJSONWithCompatibleRegex(text: string): string | null {
    // Use [\s\S] instead of . with s flag to match any character including newlines
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    return jsonMatch ? jsonMatch[0] : null;
  }

  // Solution 2: Better regex that handles nested braces (ES5+ compatible)
  // function extractJSONWithNestedBraces(text: string): string | null {
  //   // More precise regex that handles nested objects
  //   const jsonMatch = text.match(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/);
  //   return jsonMatch ? jsonMatch[0] : null;
  // }

  // Solution 3: Manual brace counting (most reliable)
  function extractJSONWithBraceCount(text: string): string | null {
    const startIndex = text.indexOf("{");
    if (startIndex === -1) return null;

    let braceCount = 0;
    let inString = false;
    let escaped = false;

    for (let i = startIndex; i < text.length; i++) {
      const char = text[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === "{") {
          braceCount++;
        } else if (char === "}") {
          braceCount--;
          if (braceCount === 0) {
            return text.substring(startIndex, i + 1);
          }
        }
      }
    }

    return null;
  }

  // Complete updated parsing function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function parseAIResponseFixed(apiData: any): Promise<any> {
    console.log("Raw API response:", apiData);
    console.log("Answer field:", apiData.answer);

    let parsedReport;

    try {
      // Method 1: Direct parsing if data.answer is already JSON
      parsedReport =
        typeof apiData.answer === "string"
          ? JSON.parse(apiData.answer)
          : apiData.answer;
      console.log("✅ Direct parsing successful");
      return parsedReport;
    } catch (parseError) {
      console.log("❌ Direct parsing failed, trying cleanup methods...");

      try {
        // Method 2: Clean the string and parse
        const cleanedAnswer = apiData.answer
          .replace(/```json\n?/g, "") // Remove ```json
          .replace(/```\n?/g, "") // Remove ```
          .replace(/^\s+|\s+$/g, "") // Trim whitespace
          .replace(/\r?\n/g, " ") // Replace newlines with spaces
          .replace(/,\s*}/g, "}") // Fix trailing commas in objects
          .replace(/,\s*]/g, "]"); // Fix trailing commas in arrays

        parsedReport = JSON.parse(cleanedAnswer);
        console.log("✅ Cleanup parsing successful");
        return parsedReport;
      } catch (secondParseError) {
        console.log("❌ Cleanup parsing failed, trying regex extraction...");

        try {
          // Method 3: Extract JSON using brace counting (most reliable)
          const extractedJSON = extractJSONWithBraceCount(apiData.answer);
          if (extractedJSON) {
            parsedReport = JSON.parse(extractedJSON);
            console.log("✅ Brace counting extraction successful");
            return parsedReport;
          }

          // Method 4: Fallback to compatible regex
          const regexMatch = extractJSONWithCompatibleRegex(apiData.answer);
          if (regexMatch) {
            parsedReport = JSON.parse(regexMatch);
            console.log("✅ Regex extraction successful");
            return parsedReport;
          }

          throw new Error("No valid JSON found in response");
        } catch (extractionError) {
          console.error("❌ All parsing methods failed:", extractionError);
          console.error("Original answer:", apiData.answer);
          throw extractionError;
        }
      }
    }
  }

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert("Please add a description");
      return;
    }

    if (photos.length === 0) {
      alert("Please capture or upload at least one photo");
      return;
    }

    if (!location.lat || !location.lng) {
      alert("Location not available. Please enable location services or select location manually.");
      return;
    }

    console.log("📍 Using location:", location);

    try {
      setIsLoading(true);

      console.log("📤 Uploading to MongoDB + Blockchain...");

      // Create form data
      const formData = new FormData();
      
      // Add all photos
      photos.forEach((photo) => {
        formData.append('images', photo);
      });
      
      // Add metadata
      formData.append('title', description.substring(0, 100));
      formData.append('description', description);
      formData.append('location', JSON.stringify({
        lat: location.lat,
        lng: location.lng,
        address: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      }));
      formData.append('severity', 'Medium');
      formData.append('reporter_address', '0x0000000000000000000000000000000000000000');

      // Submit using API utility
      const result = await api.submitIncident(formData);
      console.log("✅ Backend response:", result);

      if (!result.success) {
        throw new Error(result.message || 'Submission failed');
      }

      // Create report data for local storage
      const reportData = {
        id: result.incident_id,
        mongodb_id: result.mongodb_id,
        blockchain_tx: result.blockchain_tx,
        combined_hash: result.combined_hash,
        title: description.substring(0, 50) + (description.length > 50 ? "..." : ""),
        description: description,
        location: {
          lat: location.lat,
          lng: location.lng,
          address: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
        },
        severity: "Medium",
        timestamp: Date.now(),
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      };

      console.log("💾 Saving report to local storage...");
      
      // Get existing reports from local storage
      const existingReports = JSON.parse(localStorage.getItem("incident_reports") || "[]");
      
      // Add new report
      existingReports.unshift(reportData);
      
      // Save back to local storage
      localStorage.setItem("incident_reports", JSON.stringify(existingReports));
      
      console.log("✅ Report saved successfully!");
      console.log("📊 Total reports:", existingReports.length);
      
      // Build success message
      let successMessage = `Report submitted successfully! 🎉\n\n✅ Stored in MongoDB: ${result.mongodb_id}\n`;
      
      if (result.blockchain_tx) {
        successMessage += `✅ Blockchain TX: ${result.blockchain_tx.substring(0, 20)}...\n`;
      } else {
        successMessage += `⚠️  Blockchain TX: Not submitted (check Ganache)\n`;
      }
      
      successMessage += `✅ Hash: ${result.combined_hash.substring(0, 20)}...`;
      
      alert(successMessage);
      
      // Reset form
      setPhotos([]);
      setPreviews([]);
      setDescription("");
      setIsLoading(false);
      
      // Redirect to home
      router.push("/");

    } catch (err) {
      console.log("❌ Error submitting report:", err);
      alert(`Failed to submit report: ${err instanceof Error ? err.message : 'Unknown error'}\n\nPlease check:\n- Backend is running (http://localhost:8000)\n- MongoDB is connected\n- Ganache is running`);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Nav />
      </div>
      <div className="mt-20 p-6 space-y-4 min-h-[80vh] flex flex-col items-center bg-background">
        <div className="text-center space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Report Incident
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Upload photos and provide context 📝
          </p>
        </div>

        {/* Camera capture */}
        <div className="flex flex-col items-center space-y-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            width={320}
            height={240}
            className="rounded-lg shadow-md border border-border"
          />
          <canvas ref={canvasRef} width={320} height={240} className="hidden" />
          <div className="flex gap-2 mt-2">
            <button
              onClick={capturePhoto}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-sm"
            >
              Capture Photo
            </button>
            <label className="bg-black hover:bg-black/70 text-primary-foreground px-4 py-2 rounded-lg cursor-pointer shadow-sm">
              Upload from Device
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* Preview Section */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            {previews.map((src, index) => (
              <div key={index} className="relative">
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg shadow-md border border-border"
                />
                <button
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full px-2 py-1 text-xs shadow"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Description input */}
        <textarea
          placeholder="Add context about the incident..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full sm:max-w-lg p-3 text-sm md:text-base border border-border rounded-lg focus:ring-2 focus:ring-ring focus:outline-none shadow-sm mt-4 bg-background text-foreground"
          rows={2}
        />

        {/* Location Selection */}
        <div className="w-full sm:max-w-lg mt-4 space-y-3">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">📍 Incident Location</h3>
              {location.lat && location.lng ? (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Latitude: {location.lat.toFixed(6)}</p>
                  <p>Longitude: {location.lng.toFixed(6)}</p>
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Location {locationMode === "current" ? "detected" : "selected"}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-yellow-600">⚠️ No location set</p>
              )}
            </div>
            
            <button
              onClick={() => {
                setLocationMode("current");
                console.log("🔄 Refreshing current location...");
                navigator.geolocation.getCurrentPosition(
                  (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setLocation(loc);
                    setMapViewport({
                      longitude: pos.coords.longitude,
                      latitude: pos.coords.latitude,
                      zoom: 15
                    });
                    console.log("✅ Location updated:", loc);
                  },
                  (err) => {
                    console.error("❌ Error:", err);
                    alert("Unable to get location. Please select manually.");
                  }
                );
              }}
              className="ml-3 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              🔄 Use Current
            </button>
          </div>

          {/* Toggle Map Button */}
          <button
            onClick={() => {
              setShowMap(!showMap);
              setLocationMode("manual");
              if (!showMap && location.lat && location.lng) {
                setMapViewport({
                  longitude: location.lng,
                  latitude: location.lat,
                  zoom: 15
                });
              }
            }}
            className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
          >
            {showMap ? "✓ Close Map" : "🗺️ Select Location on Map"}
          </button>

          {/* Map for Manual Selection */}
          {showMap && (
            <div className="border-2 border-purple-500 rounded-lg overflow-hidden">
              <div className="bg-purple-50 p-2 text-sm text-center">
                Click on the map to set incident location
              </div>
              <Map
                {...mapViewport}
                onMove={(evt) => setMapViewport(evt.viewState)}
                onClick={(e) => {
                  const { lng, lat } = e.lngLat;
                  setLocation({ lat, lng });
                  console.log("📍 Manual location selected:", { lat, lng });
                }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: "100%", height: "400px" }}
              >
                {location.lat && location.lng && (
                  <Marker
                    longitude={location.lng}
                    latitude={location.lat}
                    anchor="bottom"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg animate-pulse" />
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                        Incident Location
                      </div>
                    </div>
                  </Marker>
                )}
              </Map>
              <div className="bg-gray-100 p-2 text-xs text-center text-gray-600">
                {location.lat && location.lng 
                  ? `Selected: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
                  : "Click anywhere on the map to mark incident location"
                }
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`w-full sm:w-auto px-6 text-primary-foreground font-medium py-2 md:py-3 text-sm md:text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-200 mt-4
          ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          {isLoading ? "Submitting..." : "Submit Incident"}
        </button>
      </div>
    </>
  );
}
