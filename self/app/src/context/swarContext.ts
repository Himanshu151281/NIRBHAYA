import React from "react";

export interface Report {
  caseId: number;
  latitude: string;
  longitude: string;
  title: string;
  description: string;
  timestamp: number;
  images: string[];
  severity: string;   // "high" | "medium" | "low"
  reportType: string;
  pincode: string;
  userAddress: string;
}

export interface SwarContextType {
  currentAccount: string;
  connectWallet: () => Promise<void>;
  backendURL: string;

  // Contract functions
  addUserToWhitelist: (userAddress: string) => Promise<void>;
  removeUserFromWhitelist: (userAddress: string) => Promise<void>;
  addReport: (
    title: string,
  description: string,
  fullText: string,
  location: string,
  latitude: string,
  longitude: string,
  image: string,
  severity: string,
  pincode: string
  ) => Promise<void>;
  getReportsByUser: (userAddress: string) => Promise<Report[]>;
  getAllReports: () => Promise<Report[]>;
    whitelistAddress(): Promise<void>;
  isWhitelistedFunc: (userAddress: string) => Promise<boolean>;
  getReportById: (caseId: number) => Promise<Report | null>;

}

// Create context
export const SwarContext = React.createContext<
  SwarContextType | undefined
>(undefined);
