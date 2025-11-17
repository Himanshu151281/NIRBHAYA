"use client";

import { useSwarakhsha } from "@/utils/useSwarContext";
import { countries, getUniversalLink } from "@selfxyz/core";
import {
  SelfAppBuilder,
  SelfQRcodeWrapper,
  type SelfApp,
} from "@selfxyz/qrcode";
import { useRouter } from "next/navigation"; // ✅ Changed from "next/router"
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const { whitelistAddress, currentAccount, isWhitelistedFunc } =
    useSwarakhsha();

  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false); // ✅ Added mounting state
  const [linkCopied, setLinkCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState("0x0000000000000000000000000000000000000000");

  // Use useMemo to cache the array to avoid creating a new array on each render
  const excludedCountries = useMemo(() => [countries.UNITED_STATES], []);

  // ✅ Handle mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ✅ Initialize Self app only after mounting
  useEffect(() => {
    if (!isMounted) return; // Don't run until mounted

    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Self Workshop",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "self-workshop",
        endpoint: `${process.env.NEXT_PUBLIC_SELF_ENDPOINT}`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png", // url of a png image, base64 is accepted but not recommended
        userId: userId,
        endpointType: "staging_celo",
        userIdType: "hex", // use 'hex' for ethereum address or 'uuid' for uuidv4
        userDefinedData: "Hello Taipei Blockchain Week and XueDAO",
        disclosures: {
          // what you want to verify from users' identity
          minimumAge: 18,
          // ofac: true,
          // excludedCountries: excludedCountries,

          // what you want users to reveal
          // name: false,
          // issuing_state: true,
          nationality: true,
          // date_of_birth: true,
          // passport_number: false,
          gender: true,
          // expiry_date: false,
        },
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
    }
  }, [excludedCountries, userId, isMounted]); // ✅ Added isMounted dependency

  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const copyToClipboard = async () => {
    if (!universalLink || !isMounted) return; // ✅ Check if mounted

    try {
      await navigator.clipboard.writeText(universalLink);
      setLinkCopied(true);
      displayToast("Universal link copied to clipboard!");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      displayToast("Failed to copy link");
    }
  };

  const openSelfApp = () => {
    if (!universalLink || !isMounted) return; // ✅ Check if mounted

    window.open(universalLink, "_blank");
    displayToast("Opening Self App...");
  };

  const handleSuccessfulVerification = async () => {
    if (!isMounted) return; // ✅ Check if mounted

    displayToast("Verification successful! Redirecting...");

    // ✅ Add delay and proper error handling for router navigation
    await whitelistAddress();
    // setTimeout(async () => {
    //   try {
    //     //     console.log("User whitelisted, redirecting to home...");
    //     //     // Add small delay to ensure router is ready
    //     //     setTimeout(() => {
    //     //       router.push("/");
    //     //     }, 100);

    //     // isWhitelistedFunc
    //   } catch (error) {
    //     console.error("Whitelisting failed:", error);
    //     displayToast("Whitelisting failed. Please try again.");
    //   }
    // }, 1500);
  };

  // ✅ Show loading state until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading Self Protocol...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
          {process.env.NEXT_PUBLIC_SELF_APP_NAME || "Self Workshop"}
        </h1>
        <button onClick={whitelistAddress}> test</button>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          Scan QR code with Self Protocol App to verify your identity
        </p>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto">
        <div className="flex justify-center mb-4 sm:mb-6">
          {selfApp ? (
            <SelfQRcodeWrapper
              selfApp={selfApp}
              onSuccess={handleSuccessfulVerification}
              onError={() => {
                displayToast("Error: Failed to verify identity");
              }}
            />
          ) : (
            <div className="w-[256px] h-[256px] bg-gray-200 animate-pulse flex items-center justify-center">
              <p className="text-gray-500 text-sm">Loading QR Code...</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 mb-4 sm:mb-6">
          <button
            type="button"
            onClick={copyToClipboard}
            disabled={!universalLink}
            className="flex-1 bg-gray-800 hover:bg-gray-700 transition-colors text-white p-2 rounded-md text-sm sm:text-base disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {linkCopied ? "Copied!" : "Copy Universal Link"}
          </button>

          <button
            type="button"
            onClick={openSelfApp}
            disabled={!universalLink}
            className="flex-1 bg-blue-600 hover:bg-blue-500 transition-colors text-white p-2 rounded-md text-sm sm:text-base mt-2 sm:mt-0 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Open Self App
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 mt-2">
          <span className="text-gray-500 text-xs uppercase tracking-wide">
            User Address
          </span>
          <div className="bg-gray-100 rounded-md px-3 py-2 w-full text-center break-all text-sm font-mono text-gray-800 border border-gray-200">
            {userId ? (
              userId
            ) : (
              <span className="text-gray-400">Not connected</span>
            )}
          </div>
        </div>

        {/* Toast notification */}
        {showToast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white py-2 px-4 rounded shadow-lg animate-fade-in text-sm z-50">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
