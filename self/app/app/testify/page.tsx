"use client";

import Nav from "@/components/custom/Nav"; // adjust path based on your structure
import { useSwarakhsha } from "@/utils/useSwarContext";
import { useRouter } from "next/navigation"; // ✅ useRouter instead of useNavigate
import { PinataSDK } from "pinata";
import { useEffect, useRef, useState } from "react";

export default function ReportIncident() {
  const { addReport } = useSwarakhsha();

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

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ✅ In Next.js, use NEXT_PUBLIC_ for client env vars
  const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
    pinataGateway: "coral-light-cicada-276.mypinata.cloud",
  });

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Ask location on load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => console.error("Error getting location", err)
    );
  }, []);

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
    try {
      setIsLoading(true);

      const uploadedHashes: string[] = [];

      for (const photo of photos) {
        const response = await pinata.upload.public.file(photo);
        uploadedHashes.push(response.cid ?? "");
      }

      console.log("Uploaded image IPFS hashes:", uploadedHashes);

      const incidentData = {
        description,
        location,
        images: uploadedHashes,
      };

      console.log("Submitting Incident Data:", incidentData);

      const today = new Date();
      const formattedDate = today.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      try {
        const res = await fetch("/api/ai/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query:
              'Given the description, return only a valid JSON object in this exact format: { "id": "1", "pincode: 110076, "title": "Eve teasing near metro station", "description": "Suspicious behavior reported at the Rajiv Chowk metro area.", "fullText": "I was waiting outside the metro station when I noticed a group of men following women and passing inappropriate comments. It made the environment unsafe. The authorities should increase patrolling in this area.", "date": "Sep 22, 2025", "location": "Rajiv Chowk, New Delhi", "severity": "High", "images": ["ipfshash", "ipfshash"] }. Return ONLY the JSON object, no markdown formatting, no additional text. The date in the json response should be' +
              formattedDate +
              "date, the location should be latitude=" +
              incidentData.location.lat +
              ", longitude=" +
              incidentData.location.lng +
              ". The severity should be one of Low, Medium, High based on the description. The images field should use the uploaded IPFS hashes. Make sure the JSON is correctly formatted and parsable.",
            context:
              description +
              " Images: " +
              uploadedHashes.join(", ") +
              ". Set the location as well as determine the pincode using the latitude and longitude values provided above.",
          }),
        });

        if (res.ok) {
          const data = await res.json();

          // Use the fixed parsing function
          const parsedReport = await parseAIResponseFixed(data);

          // Now you can access individual values safely
          console.log("✅ Successfully parsed report:", parsedReport);
          console.log("Individual values and their types:");

          const long = incidentData.location.lng?.toString();
          const lat = incidentData.location.lat?.toString();

          console.log("Types of values being sent to addReport:");
          console.log(
            "Title:",
            parsedReport.title,
            "| Type:",
            typeof parsedReport.title
          );
          console.log(
            "Description:",
            parsedReport.description,
            "| Type:",
            typeof parsedReport.description
          );
          console.log(
            "FullText:",
            parsedReport.fullText,
            "| Type:",
            typeof parsedReport.fullText
          );
          console.log(
            "Location:",
            parsedReport.location,
            "| Type:",
            typeof parsedReport.location
          );
          console.log("Latitude:", lat || "", "| Type:", typeof (lat || ""));
          console.log("Longitude:", long || "", "| Type:", typeof (long || ""));
          console.log(
            "Image:",
            parsedReport.images[0],
            "| Type:",
            typeof parsedReport.images[0]
          );
          console.log(
            "Severity:",
            parsedReport.severity,
            "| Type:",
            typeof parsedReport.severity
          );
          console.log(
            "Pincode:",
            parsedReport.pincode,
            "| Type:",
            typeof parsedReport.pincode
          );

          // const jsonString: string[] = JSON.stringify(parsedReport.images);

          // console.log("Images array:", jsonString);

          addReport(
            parsedReport.title,
            parsedReport.description,
            parsedReport.fullText,
            parsedReport.location,
            lat || "",
            long || "",
            parsedReport.images[0],
            parsedReport.severity,
            parsedReport.pincode
          );

          // Use the parsed data in your application
          // setReportData(parsedReport);
        } else {
          console.error("API request failed:", res.status, res.statusText);
        }
      } catch (error) {
        console.error("Error sending data to backend:", error);
      }

      router.replace("/"); // ✅ Next.js navigation
    } catch (err) {
      console.error("Error uploading images:", err);
      alert("Failed to upload images. Please try again.");
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
