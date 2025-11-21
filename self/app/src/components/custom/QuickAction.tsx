import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Camera, Shield, Bell } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    id: "sos",
    title: "SOS Alert",
    description: "Send instant alert to trusted contacts with your live location",
    icon: AlertTriangle,
    href: "/sos",
    gradient: "from-red-500 to-red-600",
    emoji: "🆘",
  },
  {
    id: "report",
    title: "Report Incident",
    description: "Upload photo/video evidence with AI verification",
    icon: Camera,
    href: "/testify",
    gradient: "from-purple-600 to-pink-600",
    emoji: "📸",
  },
  {
    id: "route",
    title: "Safe Route",
    description: "Plan safest path with real-time danger zone avoidance",
    icon: Shield,
    href: "/search-location",
    gradient: "from-blue-500 to-cyan-500",
    emoji: "🛡️",
  },
  {
    id: "alert",
    title: "Set Alert Zone",
    description: "Get notified when entering high-risk areas",
    icon: Bell,
    href: "/alerts",
    gradient: "from-orange-500 to-amber-500",
    emoji: "🔔",
  },
];

export default function QuickActions() {
  return (
    <section className="py-20 px-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,rgba(139,92,246,0.3)_1px,transparent_0)] bg-[length:40px_40px]" />
      </div>

      <div className="container max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-purple-200 shadow-lg mb-4">
            <span className="text-sm font-bold text-purple-600">⚡ Quick Actions</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Stay Protected in{" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Seconds
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            One-tap access to life-saving features powered by AI and blockchain
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={action.id} href={action.href}>
                <Card
                  className="group relative h-full border-2 border-transparent hover:border-purple-200 rounded-3xl bg-white overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <CardContent className="p-8 relative">
                    {/* Icon with Animated Background */}
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity`} />
                        <div className={`relative p-5 rounded-3xl bg-gradient-to-br ${action.gradient} shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-10 w-10 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Title with Emoji */}
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <span className="text-3xl group-hover:scale-110 transition-transform">
                        {action.emoji}
                      </span>
                      <h3 className="font-black text-xl text-gray-900">
                        {action.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 text-center leading-relaxed mb-6">
                      {action.description}
                    </p>

                    {/* Action Button */}
                    <Button
                      className={`w-full rounded-2xl bg-gradient-to-r ${action.gradient} text-white font-bold shadow-lg group-hover:shadow-2xl transition-all duration-300`}
                    >
                      <span className="group-hover:scale-110 inline-block transition-transform">
                        Get Started →
                      </span>
                    </Button>

                    {/* Corner Accent */}
                    <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
