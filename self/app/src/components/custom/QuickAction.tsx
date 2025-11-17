import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Camera, MapPin, Shield } from "lucide-react";

const actions = [
  {
    id: "sos",
    title: "SOS Alert",
    description: "Send instant alert to trusted contacts with location",
    icon: AlertTriangle,
    variant: "destructive" as const,
    emoji: "🔴",
  },
  {
    id: "report",
    title: "Report Incident",
    description:
      "Upload photo/video, describe the situation, and get verified on-chain",
    icon: Camera,
    variant: "default" as const,
    emoji: "📸",
  },
  {
    id: "route",
    title: "Safe Route Planner",
    description: "AI suggests the safest route to your destination",
    icon: Shield,
    variant: "default" as const,
    emoji: "🛡️",
  },
  {
    id: "reports",
    title: "View Reports",
    description: "Check nearby incidents or your past reports",
    icon: MapPin,
    variant: "outline" as const,
    emoji: "📍",
  },
];

export default function QuickActions() {
  return (
    <section className="py-12 px-4 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-foreground">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Card
                key={action.id}
                className="group hover:shadow-lg transition-all duration-200 border-border/50 rounded-xl"
              >
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-2xl bg-card group-hover:scale-110 transition-transform duration-200">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl">{action.emoji}</span>
                    <h3 className="font-semibold text-foreground">
                      {action.title}
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {action.description}
                  </p>

                  <Button
                    variant={action.variant}
                    className="w-full rounded-xl"
                    size="sm"
                  >
                    {action.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
