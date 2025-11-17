"use client";

import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { useRouter } from "next/navigation"; // ✅ Changed from "next/router"
import React, { useEffect, useState } from "react";
import abi from "../utils/abi.json";
import { SwarContext } from "./swarContext";

declare global {
  interface EthereumProvider {
    request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    on?(eventName: string, callback: (...args: unknown[]) => void): void;
    removeListener?(
      eventName: string,
      callback: (...args: unknown[]) => void
    ): void;
  }
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export const SwarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const backendURL = "http://localhost:8080";

  const [chainId, setChainId] = useState<string>("");
  const [currentAccount, setCurrentAccount] = useState<string>("");
  const [swarakshaContract, setSwarakshaContract] =
    useState<ethers.Contract | null>(null);
  const [isWhitelistedState, setIsWhitelistedState] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false); // ✅ Added mounting state

  const contractAddress = "0xA40086386174Cb0DcA5C34f619E8960dFF3a21f1";
  const contractABI = abi;

  const router = useRouter();

  // ✅ Handle mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Safe window access
  const ethereum = typeof window !== "undefined" ? window.ethereum : undefined;

  // -------------------------
  // Initialize contract
  // -------------------------
  useEffect(() => {
    const initContract = async () => {
      if (!ethereum || !currentAccount) return;
      try {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        setSwarakshaContract(contract);
      } catch (err) {
        console.error("Contract init error:", err);
      }
    };
    initContract();
  }, [ethereum, currentAccount]);

  // -------------------------
  // Wallet check on load
  // -------------------------
  useEffect(() => {
    if (!isMounted || !ethereum) return; // ✅ Check if mounted

    const handleChainChanged = () => window.location.reload();

    const checkWallet = async () => {
      try {
        const accounts = (await ethereum.request({
          method: "eth_accounts",
        })) as string[];
        setCurrentAccount(accounts[0] || "");
        const chain = (await ethereum.request({
          method: "eth_chainId",
        })) as string;
        setChainId(chain);
      } catch (err) {
        console.error(err);
      }
    };

    checkWallet();
    ethereum?.on?.("chainChanged", handleChainChanged);

    return () => {
      ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [ethereum, isMounted]); // ✅ Added isMounted dependency

  // -------------------------
  // Connect wallet
  // -------------------------
  const connectWallet = async () => {
    if (!ethereum) return alert("Install MetaMask!");
    try {
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      setCurrentAccount(accounts[0]);
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------
  // Switch network to Celo Alfajores
  // -------------------------
  const switchNetwork = async () => {
    if (!ethereum) return;
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x221" }],
      });
    } catch (err) {
      console.error("Network switch error:", err);
    }
  };

  useEffect(() => {
    if (chainId !== "0x221" && currentAccount) switchNetwork();
  }, [chainId, currentAccount]);

  // -------------------------
  // Whitelist helpers
  // -------------------------
  // const isWhitelisted = useCallback(
  //   async (userAddress: string) => {
  //     if (!swarakshaContract) return false;
  //     try {
  //       return await swarakshaContract.isWhitelisted(userAddress);
  //     } catch (err) {
  //       console.error(err);
  //       return false;
  //     }
  //   },
  //   [swarakshaContract]
  // );

  // const whitelistAddress = useCallback(async () => {
  //   if (!swarakshaContract || !currentAccount) return;
  //   try {
  //     const tx = await swarakshaContract.addUserToWhitelist(currentAccount);
  //     await tx.wait();
  //     setIsWhitelistedState(true);
  //   } catch (err) {
  //     console.error("Whitelist error:", err);
  //   }
  // }, [swarakshaContract, currentAccount]);

  // function addReport(
  //       uint256 _caseId,
  //       string memory _title,
  //       string memory _description,
  //       string memory _fullText,
  //       string memory _location,
  //       string[] memory _images,
  //       string memory _severity,
  //       string memory _pincode
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
    if (!swarakshaContract || !currentAccount) return;

    try {
      const tx = await swarakshaContract.addReport(
        title,
        description,
        fullText,
        location,
        latitude,
        longitude,
        image,
        severity,
        pincode
      );
      await tx.wait();
      console.log("Report added successfully");
    } catch (err) {
      console.error("Add report error:", err);
    }
  };

  const getReportById = async (caseId: number): Promise<Report> => {
    const report = await swarakshaContract?.getReportById(caseId);
    return {
      caseId: Number(report.caseId),
      title: report.title,
      description: report.description,
      fullText: report.fullText,
      location: report.location,
      latitude: report.latitude,
      longitude: report.longitude,
      image: report.image,
      severity: report.severity,
      pincode: report.pincode,
      timestamp: Number(report.timestamp),
      userAddress: report.userAddress,
    };
  };

  const whitelistAddress = async () => {
    // Check env variables
    console.log(
      "Whitelisting address:",
      currentAccount,
      process.env.NEXT_PUBLIC_APP_RPC_URL,
      process.env.NEXT_PUBLIC_APP_PRIVATE_KEY
    );

    if (
      !process.env.NEXT_PUBLIC_APP_RPC_URL ||
      !process.env.NEXT_PUBLIC_APP_PRIVATE_KEY
    ) {
      throw new Error("RPC URL or private key is missing in env");
    }

    // Provider + wallet
    const provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_APP_RPC_URL);
    const wallet = new Wallet(
      process.env.NEXT_PUBLIC_APP_PRIVATE_KEY,
      provider
    );

    // Contract instance
    const contract = new ethers.Contract(contractAddress, abi, wallet);

    try {
      // Make sure currentAccount is a valid Ethereum address
      if (!ethers.isAddress(currentAccount)) {
        throw new Error("Invalid Ethereum address provided");
      }

      const tx = await contract.addUserToWhitelist(currentAccount);
      const receipt = await tx.wait(); // waits for 1 confirmation
      console.log("Address whitelisted, tx hash:", receipt.transactionHash);
    } catch (err) {
      console.error("Whitelist error:", err);
    }
  };

  const isWhitelistedFunc = async (userAddress: string) => {
    if (!swarakshaContract) return false;
    try {
      return await swarakshaContract.isWhitelisted(userAddress);
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  useEffect(() => {
    const isWhitelistedFunc = async (userAddress: string) => {
      if (!swarakshaContract) return false;
      try {
        return await swarakshaContract.isWhitelisted(userAddress);
      } catch (err) {
        console.error(err);
        return false;
      }
    };

    const fetchWhitelistStatus = async () => {
      if (!currentAccount) return;
      // const res = await isWhitelisted(currentAccount);
      const res = await isWhitelistedFunc(currentAccount);

      setIsWhitelistedState(res);
    };
    fetchWhitelistStatus();
  }, [currentAccount, swarakshaContract]); // ✅ Added swarakshaContract dependency

  // ✅ Fixed navigation logic with proper mounting check
  useEffect(() => {
    if (!isMounted) return; // Don't navigate until mounted

    // Add small delay to ensure router is ready
    console.log("Navigation check:", { currentAccount, isWhitelistedState });

    const navigationTimer = setTimeout(() => {
      if (!currentAccount) {
        router.push("/connect");
      } else if (currentAccount && !isWhitelistedState) {
        router.push("/self-login");
      } else {
        router.push("/");
      }
    }, 100);

    return () => clearTimeout(navigationTimer);
  }, [currentAccount, isWhitelistedState, router, isMounted]);

  // -------------------------
  // Contract functions
  // -------------------------
  const addUserToWhitelist = async (userAddress: string) => {
    if (!swarakshaContract) return;
    try {
      const tx = await swarakshaContract.addUserToWhitelist(userAddress);
      await tx.wait();
      console.log("User added:", userAddress);
    } catch (err) {
      console.error(err);
    }
  };

  const removeUserFromWhitelist = async (userAddress: string) => {
    if (!swarakshaContract) return;
    try {
      const tx = await swarakshaContract.removeUserFromWhitelist(userAddress);
      await tx.wait();
      console.log("User removed:", userAddress);
    } catch (err) {
      console.error(err);
    }
  };

  const getReportsByUser = async (userAddress: string) => {
    if (!swarakshaContract) return [];
    try {
      return await swarakshaContract.getReportsByUser(userAddress);
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const getAllReports = async () => {
    if (!swarakshaContract) return [];
    try {
      return await swarakshaContract.getAllReports();
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  return (
    <SwarContext.Provider
      value={{
        currentAccount,
        connectWallet,
        backendURL,
        addUserToWhitelist,
        removeUserFromWhitelist,
        addReport,
        getReportsByUser,
        getAllReports,
        whitelistAddress,
        isWhitelistedFunc, // ✅ Added to context for easier access
        getReportById,
      }}
    >
      {children}
    </SwarContext.Provider>
  );
};
