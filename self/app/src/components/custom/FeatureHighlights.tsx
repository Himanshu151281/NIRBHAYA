import { Card, CardContent } from "@/components/ui/card";
import { Brain, ShieldCheck, Users } from "lucide-react";

const features = [
  {
    title: "AI-Powered Safety",
    description: "Our AI identifies danger zones and suggests safer paths.",
    icon: Brain,
    color: "text-purple-600",
  },
  {
    title: "Verified & Secure",
    description:
      "All reports are stored on-chain and verifiable via Self Passport zkID.",
    icon: ShieldCheck,
    color: "text-pink-600",
  },
  {
    title: "Community Driven",
    description: "Join a network of women supporting each other's safety.",
    icon: Users,
    color: "text-purple-500",
  },
];

export default function FeatureHighlights() {
  return (
    <section className="py-16 px-4 bg-white/50 backdrop-blur-sm">
      <div className="container max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="text-center border-purple-100 hover:shadow-xl hover:scale-105 transition-all duration-200 bg-white"
              >
                <CardContent className="p-8">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-100">
                      <Icon className={`h-10 w-10 ${feature.color}`} />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-4 text-gray-900">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
