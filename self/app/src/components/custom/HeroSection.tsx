import { Sparkles, Shield, Lock, Users, Zap, MapPin } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative py-16 px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>
      
      <div className="container max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left space-y-8">
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-lg">
              <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
              <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                AI-Powered Women Safety Platform
              </span>
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                Your Safety.
              </span>
              <br />
              <span className="text-gray-900">Our Priority.</span>
            </h1>

            {/* Hero Description */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl leading-relaxed">
              NIRBHAYA empowers women with{" "}
              <span className="font-semibold text-purple-600">AI-powered safety tools</span>,
              real-time incident reporting, and community-driven protection — all secured by{" "}
              <span className="font-semibold text-pink-600">blockchain verification</span>.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Shield, text: "24/7 Protection" },
                { icon: Lock, text: "Blockchain Verified" },
                { icon: Users, text: "Community Driven" },
                { icon: Zap, text: "Instant Alerts" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-purple-200 shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <item.icon className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/testify"
                className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Report Incident</span>
                <span className="relative group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/search-location"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-white text-gray-900 font-bold text-lg border-3 border-gray-200 hover:border-purple-300 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
              >
                <MapPin className="h-5 w-5" />
                View Safety Map
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              {[
                { value: "10K+", label: "Reports Filed" },
                { value: "99.9%", label: "Verified" },
                { value: "24/7", label: "Support" },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Hero Image/Illustration */}
          <div className="relative lg:block hidden">
            <div className="relative w-full h-[600px]">
              {/* Decorative Elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200/50 to-pink-200/50 rounded-[3rem] rotate-6 blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-tl from-purple-300/30 to-pink-300/30 rounded-[3rem] -rotate-6 blur-xl" />
              
              {/* Main Card */}
              <div className="relative bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-2xl border border-white/20 p-8 h-full flex items-center justify-center">
                <div className="text-center space-y-8">
                  {/* Large Shield Icon */}
                  <div className="relative mx-auto w-48 h-48">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-ping opacity-20" />
                    <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-12 shadow-2xl">
                      <Shield className="h-24 w-24 text-white" />
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Trusted by Women Worldwide
                    </h3>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="w-8 h-8 text-yellow-400 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-600 font-medium">
                      Rated 5.0 by 10,000+ users
                    </p>
                  </div>

                  {/* Feature Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: "🔒", title: "Secure" },
                      { icon: "⚡", title: "Fast" },
                      { icon: "🤖", title: "AI-Powered" },
                      { icon: "🌐", title: "Global" },
                    ].map((feature, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100 hover:shadow-lg transition-shadow"
                      >
                        <div className="text-3xl mb-2">{feature.icon}</div>
                        <div className="text-sm font-bold text-gray-700">{feature.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Add to globals.css:
// @keyframes blob {
//   0%, 100% { transform: translate(0, 0) scale(1); }
//   25% { transform: translate(20px, -50px) scale(1.1); }
//   50% { transform: translate(-20px, 20px) scale(0.9); }
//   75% { transform: translate(50px, 50px) scale(1.05); }
// }
// .animate-blob { animation: blob 7s infinite; }
// .animation-delay-2000 { animation-delay: 2s; }
// .animation-delay-4000 { animation-delay: 4s; }
