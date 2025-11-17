"use client";

import Nav from "@/components/custom/Nav";
import { SwarContext } from "@/context/swarContext";
import Link from "next/link";
import { useContext, useEffect, useState } from "react";

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

  // Mock data initially
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

  const [reports, setReports] = useState<Report[]>(mockIncidents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch real reports and replace mock data
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const allReports: Report[] = await getAllReports();
        if (allReports && allReports.length > 0) {
          setReports(allReports);
        }
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Failed to fetch reports. Showing mock data.");
        // Keep mock data on error
      } finally {
        setLoading(false);
      }
    };

    // if (getAllReports) {
    fetchReports();
    // }
  }, [getAllReports]);

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
      <div className="min-h-screen bg-gray-50 py-12 px-4">
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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="fixed top-0 left-0 right-0 z-50">
        <Nav />
      </div>

      <div className="max-w-3xl mx-auto pt-10">
        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Recent Reports
          </h1>
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
                <div className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer">
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
