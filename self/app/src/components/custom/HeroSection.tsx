import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 -z-10" />
      
      <div className="container max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 mb-8">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-900">AI-Powered Women Safety Platform</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
            Your Safety.
          </span>
          <br />
          <span className="text-gray-900">Our Priority.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10">
          NIRBHAYA empowers women with AI-powered safety tools, real-time incident
          reporting, and community-driven protection  all secured by blockchain verification.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/testify"
            className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            Report Incident
          </Link>
          <Link
            href="/search-location"
            className="px-8 py-4 rounded-full bg-white text-gray-900 font-semibold text-lg border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-200"
          >
            View Safety Map
          </Link>
        </div>
      </div>
    </section>
  );
}

