"use client";

import { Nav } from "@/components/custom/index";
import { Button } from "@/components/ui/button";
import { SwarContext } from "@/context/swarContext";
import { ArrowLeft, Calendar, MapPin, Shield } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

interface Report {
  caseId: number; // matches contract's caseId
  title: string;
  description: string;
  fullText?: string;
  location?: string;
  latitude: string;
  longitude: string;
  image?: string;
  images?: string[]; // for UI purposes
  severity: string;
  pincode: string;
  timestamp: number | bigint;
  userAddress: string;
  type?: string;
}

// Mock data for demo
const mockReports: Report[] = [
  {
    caseId: 1,
    title: "Eve teasing near metro station",
    description: "Suspicious behavior reported at the Rajiv Chowk metro area.",
    fullText:
      "I was waiting outside the metro station when I noticed a group of men following women and passing inappropriate comments. It made the environment unsafe. The authorities should increase patrolling in this area.",
    location: "Rajiv Chowk, New Delhi",
    latitude: "28.6139",
    longitude: "77.2090",
    severity: "High",
    pincode: "110001",
    timestamp: Math.floor(new Date("2025-09-22").getTime() / 1000),
    userAddress: "0x1234567890123456789012345678901234567890",
    images: [
      "https://placekitten.com/400/250",
      "https://placekitten.com/401/250",
    ],
  },
  {
    caseId: 2,
    title: "Unsafe dark street",
    description: "Poorly lit area feels unsafe at night.",
    fullText:
      "While returning home, I found the entire lane without proper street lights. It was extremely dark and unsafe. Proper lighting could make this place much safer.",
    location: "Dwarka Sector 12, New Delhi",
    latitude: "28.5921",
    longitude: "77.0460",
    severity: "Low",
    pincode: "110075",
    timestamp: Math.floor(new Date("2025-09-20").getTime() / 1000),
    userAddress: "0x1234567890123456789012345678901234567890",
    images: ["https://placekitten.com/402/250"],
  },
];

export default function ReportDetail() {
  const params = useParams();
  // const router = useRouter();
  const id = params?.id as string;

  const context = useContext(SwarContext);

  // Handle case where context might be null
  const getReportById = context?.getReportById;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      console.log("test");
      if (!id) {
        setError("No report ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to get real report from blockchain first
        if (getReportById) {
          try {
            const realReport = await getReportById(parseInt(id));
            if (realReport) {
              console.log("Fetched real report:", realReport);
              setReport(realReport);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn(
              "Failed to fetch real report, falling back to mock:",
              err
            );
          }
        }

        // Fallback to mock data
        const mockReport = mockReports.find((r) => r.caseId === parseInt(id));
        if (mockReport) {
          setReport(mockReport);
        } else {
          setError("Report not found");
        }
      } catch (err) {
        console.error("Error fetching report:", err);
        setError("Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, getReportById]);

  // Format date helper
  const formatDate = (timestamp: number | bigint) => {
    try {
      // Convert bigint to number safely (note: may lose precision for extremely large timestamps)
      const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;

      // If timestamp seems like seconds (less than year 2000 in ms), multiply by 1000
      const timestampMs = ts < 1e12 ? ts * 1000 : ts;

      const date = new Date(timestampMs);

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

  // Handle AI Q&A
  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;

    try {
      setAiLoading(true);
      setError(null);

      const res = await fetch("/api/ai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: aiQuestion,
          context: report?.fullText || report?.description || "",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.answer || "No response from AI.");
      } else {
        const errorData = await res.json().catch(() => ({}));
        setAiResponse(errorData.error || "Error contacting AI service.");
      }
    } catch (error) {
      console.error("AI request failed:", error);
      setAiResponse("Failed to connect to AI service. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const parseMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
      .replace(/\n/g, "<br>"); // Line breaks
  };

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

  // Loading state
  if (loading) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50">
          <Nav />
        </div>
        <div className="min-h-screen bg-gray-50 py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-xl">Loading report...</div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50">
          <Nav />
        </div>
        <div className="min-h-screen bg-gray-50 py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-xl text-red-600 mb-4">
              {error || "Report not found"} ❌
            </div>
            <Link
              href="/reports"
              className="text-primary hover:underline flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Fixed Nav */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Nav />
      </div>

      <div className="min-h-screen bg-gray-50 py-24 px-4">
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-6 space-y-6">
          {/* Back Button */}
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {report.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Case #{report.caseId}
              </p>
            </div>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${getSeverityClass(
                report.severity
              )}`}
            >
              {report.severity}
            </span>
          </div>

          {/* Meta info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDate(report.timestamp)}
            </div>
            {report.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {report.location}
              </div>
            )}
          </div>

          {/* Short description */}
          <p className="text-muted-foreground italic">{report.description}</p>

          {/* Full testification */}
          {report.fullText && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Full Report:
              </h3>
              <p className="text-gray-800 leading-relaxed">{report.fullText}</p>
            </div>
          )}

          {/* Uploaded images */}
          {((report.image && report.image.length > 0) || report.image) && (
            <div>
              <h3 className="font-semibold text-foreground mb-2">Evidence:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {
                  // report.images?.map((src, idx) => (
                  //   <img
                  //     key={idx}
                  //     src={src}
                  //     alt={`Evidence ${idx + 1}`}
                  //     className="rounded-lg shadow-sm object-cover w-full h-48"
                  //     onError={(e) => {
                  //       // Handle broken images
                  //       (e.target as HTMLImageElement).style.display = "none";
                  //     }}
                  //   />
                  // )) ||
                  report.image && (
                    <img
                      src={`https://coral-light-cicada-276.mypinata.cloud/ipfs/${report.image}`}
                      alt="Evidence"
                      className="rounded-lg shadow-sm object-cover w-full h-48"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )
                }
              </div>
            </div>
          )}

          {/* AI Q&A Section */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Ask AI for Safety
              Advice
            </h2>
            <textarea
              placeholder="Ask something like: How could this have been prevented?"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
              rows={3}
              disabled={aiLoading}
            />
            <Button
              onClick={handleAskAI}
              disabled={aiLoading || !aiQuestion.trim()}
              className="mt-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? "Asking AI..." : "Ask AI"}
            </Button>

            {aiResponse && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg text-sm text-gray-700">
                <strong>AI Response:</strong>{" "}
                <div
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(aiResponse),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
