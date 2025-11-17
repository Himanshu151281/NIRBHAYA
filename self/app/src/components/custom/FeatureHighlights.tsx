import { Card, CardContent } from "@/components/ui/card";
import { Brain, ShieldCheck, Users } from "lucide-react";

const features = [
  {
    title: "AI-Powered Safety",
    description: "Our AI identifies danger zones and suggests safer paths.",
    icon: Brain,
    color: "text-accent",
  },
  {
    title: "Verified & Secure",
    description:
      "All reports are stored on-chain and verifiable via Self Passport zkID.",
    icon: ShieldCheck,
    color: "text-primary",
  },
  {
    title: "Community Driven",
    description: "Join a network of women supporting each other's safety.",
    icon: Users,
    color: "text-secondary",
  },
];

export default function FeatureHighlights() {
  return (
    <section className="py-16 px-4">
      <div className="container max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-foreground">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="text-center border-border/50 hover:shadow-md transition-shadow duration-200"
              >
                <CardContent className="p-8">
                  <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-muted">
                      <Icon className={`h-10 w-10 ${feature.color}`} />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-4 text-foreground">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">
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
