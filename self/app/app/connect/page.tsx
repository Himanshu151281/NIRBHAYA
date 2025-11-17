"use client";
import { Button } from "@/components/ui/button";
import { SwarContext } from "@/context/swarContext";
import { useContext } from "react";

function ConnectWallet() {
  const context = useContext(SwarContext);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Button
        size="lg"
        className="rounded-2xl shadow-lg px-8 py-6 text-lg font-semibold"
        onClick={context?.connectWallet}
        disabled={!context?.connectWallet}
      >
        Connect Wallet
      </Button>
    </div>
  );
}

export default ConnectWallet;
