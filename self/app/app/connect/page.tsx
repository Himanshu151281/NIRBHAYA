"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function ConnectWallet() {
  const router = useRouter();

  useEffect(() => {
    // No wallet connection needed - backend handles blockchain via relayer
    // Redirect to home page immediately
    router.push("/");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <p className="text-lg text-gray-600 mb-4">No wallet connection needed</p>
        <p className="text-sm text-gray-500">Backend handles all blockchain transactions</p>
        <p className="text-sm text-gray-500 mt-2">Redirecting to home...</p>
      </div>
    </div>
  );
}

export default ConnectWallet;
