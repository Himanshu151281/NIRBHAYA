"use client";

import { CirclePlus, CircleUser, Home, Search } from "lucide-react";
import Link from "next/link";

function BottomBar() {
  return (
    <div className="flex justify-around bg-green-600 py-4 pointer-events-auto shadow-lg rounded-t-2xl">
      <Link
        href="/"
        className="flex flex-col items-center text-white font-medium space-y-1 cursor-pointer hover:text-green-200 hover:scale-110 transition-transform duration-200"
      >
        <Home className="w-6 h-6" />
        <span>Home</span>
      </Link>

      <Link
        href="/search"
        className="flex flex-col items-center text-white font-medium space-y-1 cursor-pointer hover:text-green-200 hover:scale-110 transition-transform duration-200"
      >
        <Search className="w-6 h-6" />
        <span>Search Bins</span>
      </Link>

      <Link
        href="/add-bin"
        className="flex flex-col items-center text-white font-medium space-y-1 cursor-pointer hover:text-green-200 hover:scale-110 transition-transform duration-200"
      >
        <CirclePlus className="w-6 h-6" />
        <span>Add Bin</span>
      </Link>

      <Link
        href="/profile"
        className="flex flex-col items-center text-white font-medium space-y-1 cursor-pointer hover:text-green-200 hover:scale-110 transition-transform duration-200"
      >
        <CircleUser className="w-6 h-6" />
        <span>Profile</span>
      </Link>
    </div>
  );
}

export default BottomBar;
