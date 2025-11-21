"use client";

import Nav from "@/components/custom/Nav";
import { SwarContext } from "@/context/swarContext";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import { Shield, CheckCircle, Upload, Camera, User } from "lucide-react";

interface Report {
  caseId: number;
  title: string;
  description: string;
  fullText?: string;
  location?: string;
  latitude: string;
  longitude: string;
  image?: string;
  severity: string;
  pincode: string;
  timestamp: number | bigint; // Allow both types
  userAddress: string;
  type?: string;
}

function Reports() {
  const context = useContext(SwarContext);

  // Handle case where context might be null
  if (!context) {
    throw new Error(
      "Reports component must be used within SwarContext.Provider"
    );
  }

  const { getAllReports } = context;

  // State declarations
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Mock data (fallback if backend fails)
  const mockIncidents: Report[] = [
    {
      caseId: 1,
      title: "Eve teasing near metro station",
      description:
        "Reported suspicious behavior at the Rajiv Chowk metro area.",
      fullText: "",
      location: "Rajiv Chowk, New Delhi",
      latitude: "28.6139",
      longitude: "77.2090",
      image: "",
      severity: "High",
      pincode: "110001",
      timestamp: Math.floor(new Date("2025-09-22").getTime() / 1000), // blockchain timestamp format (seconds)
      userAddress: "0x1234567890123456789012345678901234567890",
    },
    {
      caseId: 2,
      title: "Street harassment",
      description: "Incident reported late evening near market.",
      fullText: "",
      location: "Lajpat Nagar, New Delhi",
      latitude: "28.5677",
      longitude: "77.2431",
      image: "",
      severity: "Medium",
      pincode: "110024",
      timestamp: Math.floor(new Date("2025-09-21").getTime() / 1000),
      userAddress: "0x1234567890123456789012345678901234567890",
    },
    {
      caseId: 3,
      title: "Unsafe dark street",
      description: "Reported poorly lit area, feels unsafe at night.",
      fullText: "",
      location: "Dwarka Sector 12, New Delhi",
      latitude: "28.5921",
      longitude: "77.0460",
      image: "",
      severity: "Low",
      pincode: "110075",
      timestamp: Math.floor(new Date("2025-09-20").getTime() / 1000),
      userAddress: "0x1234567890123456789012345678901234567890",
    },
  ];

  // Fetch real reports and replace mock data
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("📊 Fetching all reports from backend API...");
        
        // Fetch directly from backend API
        const response = await fetch(`http://localhost:8000/api/incidents/list?limit=100&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const incidents = data.incidents || [];
        
        console.log("✅ Fetched incidents from API:", incidents);
        
        if (incidents && incidents.length > 0) {
          // Map MongoDB incidents to Report format
          const mappedReports: Report[] = incidents.map((incident: any, index: number) => ({
            caseId: index + 1,
            title: incident.title || incident.metadata?.title || "Incident Report",
            description: incident.description || incident.metadata?.description || "No description",
            fullText: incident.metadata?.details || "",
            location: incident.address || incident.metadata?.address || "Unknown Location",
            latitude: incident.location?.coordinates?.[1]?.toString() || incident.metadata?.location?.coordinates?.[1]?.toString() || "0",
            longitude: incident.location?.coordinates?.[0]?.toString() || incident.metadata?.location?.coordinates?.[0]?.toString() || "0",
            image: incident.images?.[0] || "",
            severity: incident.severity || incident.metadata?.severity || "Medium",
            pincode: incident.metadata?.pincode || "000000",
            timestamp: incident.created_at ? new Date(incident.created_at).getTime() / 1000 : Date.now() / 1000,
            userAddress: incident.metadata?.reporter_id || "Anonymous",
            type: incident.incident_type || incident.metadata?.incident_type || "General"
          }));
          
          console.log("🗺️ Mapped reports for display:", mappedReports);
          setReports(mappedReports);
        } else {
          console.log("ℹ️ No reports found, showing mock data");
          // Keep mock data if no incidents
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Failed to fetch reports from server. Showing mock data.");
        // Keep mock data on error
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [refreshKey]); // Changed dependency to refreshKey instead of getAllReports

  // Manual refresh function
  const refreshReports = async () => {
    setRefreshKey(prev => prev + 1); // Trigger useEffect re-run
  };

  // Function to return severity badge styles
  const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "low":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const formatDate = (timestamp: number | bigint) => {
    try {
      // Handle both number and bigint types
      const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;

      // Check if timestamp is in seconds or milliseconds
      // If it's less than a reasonable year 2000 timestamp in seconds, assume it's in seconds
      const timestampMs = ts < 946684800 ? ts * 1000 : ts;

      const date = new Date(timestampMs);

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 py-12 px-4">
        <div className="fixed top-0 left-0 right-0 z-50">
          <Nav />
        </div>
        <div className="max-w-3xl mx-auto pt-10 text-center">
          <div className="text-xl">Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 py-12 px-4">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Nav />
      </div>

      <div className="max-w-6xl mx-auto pt-24">
        {/* Profile Verification Section */}
        <div className="mb-12 bg-white rounded-3xl shadow-2xl border-2 border-purple-200 p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 mb-4">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Get Verified
            </h1>
            <p className="text-gray-600 text-lg">
              Verify your identity to build trust in the community
            </p>
          </div>

          {/* Verification Steps */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 text-white mb-4">
                <User className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Step 1</h3>
              <p className="text-sm text-gray-600">Upload Profile Photo</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-600 text-white mb-4">
                <Camera className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Step 2</h3>
              <p className="text-sm text-gray-600">Verify with Selfie</p>
            </div>
            <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600 text-white mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Step 3</h3>
              <p className="text-sm text-gray-600">Get Verified Badge</p>
            </div>
          </div>

          {/* Verification Form */}
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Upload Profile Photo
              </label>
              <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-500 transition-all cursor-pointer bg-purple-50/30">
                <Upload className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Verify with Live Selfie
              </label>
              <button className="w-full px-6 py-4 rounded-xl bg-white border-2 border-purple-300 hover:border-purple-500 text-gray-900 font-semibold flex items-center justify-center gap-3 transition-all hover:shadow-lg">
                <Camera className="h-5 w-5 text-purple-600" />
                Take Selfie for Verification
              </button>
            </div>

            <button className="w-full px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-200">
              Submit for Verification
            </button>

            <p className="text-center text-sm text-gray-500">
              🔒 Your information is encrypted and secure
            </p>
          </div>
        </div>

        {/* Reports Section */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Recent Reports
            </h1>
            <button
              onClick={refreshReports}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-xl disabled:bg-gray-400 transition-all duration-200 font-semibold"
              title="Refresh reports"
            >
              {loading ? "⏳" : "🔄"}
            </button>
          </div>
          <p className="text-muted-foreground mt-2">
            Stay informed about the latest incidents reported on the platform.
          </p>
          {error && <p className="text-orange-600 mt-2 text-sm">{error}</p>}
        </div>

        {/* Incident List */}
        <div className="space-y-6">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No reports available at the moment.
              </p>
            </div>
          ) : (
            reports.map((report) => (
              <Link
                key={report.caseId}
                href={`/report/${report.caseId}`}
                className="block"
              >
                <div className="p-6 bg-white rounded-2xl shadow-lg border-2 border-purple-100 hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground">
                      {report.title}
                    </h2>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getSeverityClass(
                        report.severity
                      )}`}
                    >
                      {report.severity}
                    </span>
                  </div>

                  <p className="text-muted-foreground mt-1">
                    {report.description}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:justify-between mt-4 text-sm text-gray-500">
                    <span>📅 {formatDate(report.timestamp)}</span>
                    {report.location && <span>📍 {report.location}</span>}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
