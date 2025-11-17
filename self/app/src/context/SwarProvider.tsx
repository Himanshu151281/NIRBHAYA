"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { SwarContext } from "./swarContext";

interface Report {
  caseId: number;
  title: string;
  description: string;
  fullText: string;
  location: string;
  latitude: string;
  longitude: string;
  image: string;
  severity: string;
  pincode: string;
  timestamp: number;
  userAddress: string;
}

export const SwarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const backendURL = "http://localhost:8000"; // Backend API URL
  const router = useRouter();

  // ======================================
  // NO WALLET CONNECTION NEEDED
  // Backend handles all blockchain transactions using relayer account
  // ======================================

  // Stub functions for backward compatibility
  const connectWallet = async () => {
    console.log("⚠️ Wallet connection not needed - backend handles blockchain");
  };

  const addReport = async (
    title: string,
    description: string,
    fullText: string,
    location: string,
    latitude: string,
    longitude: string,
    image: string,
    severity: string,
    pincode: string
  ) => {
    console.log("⚠️ This function is deprecated - use /testify page with MongoDB + Blockchain backend");
  };

  const getReportById = async (caseId: number): Promise<Report> => {
    try {
      console.log("📊 Fetching report by ID:", caseId);
      const response = await fetch(`${backendURL}/api/incidents/${caseId}?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      const data = await response.json();
      console.log("✅ Fetched report:", data);
      return data || {
        caseId: 0,
        title: "",
        description: "",
        fullText: "",
        location: "",
        latitude: "",
        longitude: "",
        image: "",
        severity: "",
        pincode: "",
        timestamp: 0,
        userAddress: "",
      };
    } catch (error) {
      console.error("❌ Error fetching report:", error);
      return {
        caseId: 0,
        title: "",
        description: "",
        fullText: "",
        location: "",
        latitude: "",
        longitude: "",
        image: "",
        severity: "",
        pincode: "",
        timestamp: 0,
        userAddress: "",
      };
    }
  };

  const whitelistAddress = async () => {
    console.log("⚠️ Whitelisting not needed - backend handles access");
  };

  const isWhitelistedFunc = async (userAddress: string) => {
    console.log("⚠️ Whitelist check not needed - backend handles access");
    return true; // Everyone can submit
  };

  const addUserToWhitelist = async (userAddress: string) => {
    console.log("⚠️ Whitelist management not needed - backend handles access");
  };

  const removeUserFromWhitelist = async (userAddress: string) => {
    console.log("⚠️ Whitelist management not needed - backend handles access");
  };

  const getReportsByUser = async (userAddress: string) => {
    try {
      console.log("📊 Fetching reports for user:", userAddress);
      const response = await fetch(`${backendURL}/api/incidents/list?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      const data = await response.json();
      console.log("✅ Fetched reports from backend:", data);
      return data.incidents || [];
    } catch (error) {
      console.error("❌ Error fetching reports:", error);
      return [];
    }
  };

  const getAllReports = async () => {
    try {
      console.log("📊 Fetching all reports from backend API...");
      const response = await fetch(`${backendURL}/api/incidents/list?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
      const data = await response.json();
      console.log("✅ Fetched reports from backend:", data);
      return data.incidents || [];
    } catch (error) {
      console.error("❌ Error fetching reports:", error);
      return [];
    }
  };

  return (
    <SwarContext.Provider
      value={{
        currentAccount: "", // No account needed
        connectWallet,
        backendURL,
        addUserToWhitelist,
        removeUserFromWhitelist,
        addReport,
        getReportsByUser,
        getAllReports,
        whitelistAddress,
        isWhitelistedFunc,
        getReportById,
      }}
    >
      {children}
    </SwarContext.Provider>
  );
};
