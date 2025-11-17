/**
 * Updated handleSubmit function for testify page
 * Integrates IPFS + Blockchain backend endpoints
 * 
 * Replace the existing handleSubmit function in:
 * D:\Projects\NIRBHAYA\self\app\app\testify\page.tsx
 */

const handleSubmit = async () => {
  // Validation checks
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

    // ========================================
    // NEW: IPFS + Blockchain Integration
    // ========================================

    console.log("🚀 Starting IPFS + Blockchain submission...");

    // Prepare metadata
    const metadata = {
      title: description.substring(0, 50) + (description.length > 50 ? "..." : ""),
      description: description,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`
      },
      images: [], // Will be populated by backend
      severity: "Medium", // Default severity
      timestamp: Date.now(),
      date: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      reporter_address: "0x0000000000000000000000000000000000000000" // Or from wallet if integrated
    };

    // Create FormData for complete workflow endpoint
    const formData = new FormData();
    formData.append('image', photos[0]); // Upload first photo
    formData.append('metadata', JSON.stringify(metadata));

    console.log("📤 Uploading to IPFS + Blockchain...");

    // Call backend complete workflow endpoint
    const response = await fetch('http://localhost:8000/api/ipfs/submit-incident-complete', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("✅ Backend response:", data);

    if (data.success) {
      // Create report data with blockchain info
      const reportData = {
        id: data.incident_id || Date.now(),
        title: metadata.title,
        description: metadata.description,
        location: metadata.location,
        images: [data.image_cid], // Store IPFS CID
        severity: metadata.severity,
        timestamp: metadata.timestamp,
        date: metadata.date,
        // Blockchain data
        image_cid: data.image_cid,
        metadata_cid: data.metadata_cid,
        image_url: data.image_url,
        metadata_url: data.metadata_url,
        blockchain_submitted: data.blockchain_submitted || false,
        tx_hash: data.tx_hash || null,
        explorer_url: data.explorer_url || null
      };

      console.log("💾 Saving report to local storage...");
      
      // Get existing reports from local storage
      const existingReports = JSON.parse(localStorage.getItem("incident_reports") || "[]");
      
      // Add new report
      existingReports.unshift(reportData); // Add to beginning
      
      // Save back to local storage
      localStorage.setItem("incident_reports", JSON.stringify(existingReports));
      
      console.log("✅ Report saved successfully!");
      console.log("📊 Total reports:", existingReports.length);
      
      // Success message with blockchain info
      let successMessage = `✅ Incident submitted successfully!\n\n`;
      successMessage += `📍 Location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\n`;
      successMessage += `📸 Image stored on IPFS\n`;
      successMessage += `   CID: ${data.image_cid}\n`;
      successMessage += `   URL: ${data.image_url}\n\n`;
      successMessage += `📋 Metadata stored on IPFS\n`;
      successMessage += `   CID: ${data.metadata_cid}\n`;
      
      if (data.blockchain_submitted) {
        successMessage += `\n⛓️ Blockchain verified!\n`;
        successMessage += `   Incident ID: ${data.incident_id}\n`;
        successMessage += `   TX Hash: ${data.tx_hash}\n`;
        successMessage += `   View on Explorer: ${data.explorer_url}`;
      } else {
        successMessage += `\n⚠️ Note: Blockchain anchoring pending\n`;
        successMessage += `Data is safely stored on IPFS`;
      }
      
      alert(successMessage);
      
      // Reset form
      setPhotos([]);
      setPreviews([]);
      setDescription("");
      setIsLoading(false);
      
      // Redirect to home
      router.push("/");

    } else {
      throw new Error(data.message || "Unknown error occurred");
    }

  } catch (err) {
    console.error("❌ Error submitting report:", err);
    
    // User-friendly error messages
    let errorMessage = "Failed to submit report. ";
    
    if (err instanceof TypeError && err.message.includes("fetch")) {
      errorMessage += "Backend server is not running. Please start the backend with:\n\n";
      errorMessage += "cd backend\n";
      errorMessage += "uvicorn main:app --reload --port 8000";
    } else if (err.message.includes("500")) {
      errorMessage += "Server error. Check backend logs and ensure:\n";
      errorMessage += "1. WEB3_STORAGE_TOKEN is set in .env\n";
      errorMessage += "2. Required packages are installed:\n";
      errorMessage += "   pip install -r requirements_ipfs.txt";
    } else {
      errorMessage += err.message;
    }
    
    alert(errorMessage);
    setIsLoading(false);
  }
};


/**
 * OPTIONAL: Display blockchain info in incident list
 * 
 * Update the incident card component to show IPFS/blockchain data
 */

// In your incident display component:
{report.blockchain_submitted && (
  <div className="mt-2 pt-2 border-t border-gray-200">
    <p className="text-xs text-gray-600">
      ⛓️ Blockchain verified
    </p>
    <div className="flex gap-2 mt-1">
      <a
        href={report.image_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-600 hover:underline"
      >
        View on IPFS
      </a>
      {report.explorer_url && (
        <a
          href={report.explorer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-purple-600 hover:underline"
        >
          View TX
        </a>
      )}
    </div>
  </div>
)}
