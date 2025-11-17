"use client";

import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Home,
  MapPin,
  MessageSquare,
  Newspaper,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";

export default function Nav() {
  return (
    <header className="w-screen bg-card p-4 rounded-b-xl flex justify-between items-center shadow-md border-b border-border">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold text-foreground">Swarakhsha</span>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-6">
        {[
          { to: "/", icon: Home, label: "Home" },
          { to: "/search-location", icon: MapPin, label: "Search Location" },
          { to: "/reports", icon: Newspaper, label: "Reports" },
          { to: "/testify", icon: MessageSquare, label: "Testify" },
        ].map((item) => (
          <Link
            key={item.to}
            href={item.to}
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:flex items-center gap-2 rounded-lg text-primary hover:bg-primary/10"
        >
          <User className="h-4 w-4" />
          Profile
        </Button>
        <Button
          size="sm"
          className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-lg shadow-sm"
        >
          <AlertTriangle className="h-4 w-4" />
          SOS
        </Button>
      </div>
    </header>
  );
}
