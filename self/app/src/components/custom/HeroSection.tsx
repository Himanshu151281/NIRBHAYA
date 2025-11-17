import { Shield } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="py-28 px-4">
      <div className="container max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/10">
            <Shield className="h-16 w-16 text-primary" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
          Your Safety. Our Priority.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
          Swarakhsha helps women stay safe by reporting incidents, planning safe
          routes, and alerting trusted contacts — all powered by AI and secure
          blockchain verification.
        </p>
      </div>
    </section>
  );
}
