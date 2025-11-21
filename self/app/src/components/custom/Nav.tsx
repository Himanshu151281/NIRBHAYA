"use client";

import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  MapPin,
  MessageSquare,
  Shield,
  CheckCircle,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Island-style Navbar */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 px-6 py-4">
          <div className="flex items-center">
            {/* Logo - Left Side */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                NIRBHAYA
              </span>
            </Link>

            {/* Desktop Navigation - Right Side */}
            <nav className="hidden md:flex items-center gap-8 ml-auto">
              {[
                { to: "/search-location", icon: MapPin, label: "Safety Map" },
                { to: "/testify", icon: MessageSquare, label: "Report" },
                { to: "/reports", icon: CheckCircle, label: "Get Verified" },
              ].map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-all duration-200 font-medium group"
                >
                  <item.icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-purple-50 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col gap-4">
              {[
                { to: "/search-location", icon: MapPin, label: "Safety Map" },
                { to: "/testify", icon: MessageSquare, label: "Report" },
                { to: "/reports", icon: CheckCircle, label: "Get Verified" },
              ].map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-purple-50 transition-colors"
                >
                  <item.icon className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-gray-700">{item.label}</span>
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {/* <Button className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold">
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button> */}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Spacer for fixed navbar */}
      <div className="h-24" />
    </>
  );
}
