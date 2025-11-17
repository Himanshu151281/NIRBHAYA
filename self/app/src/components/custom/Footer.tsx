import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-8 px-4">
      <div className="container max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Swarakhsha 🔐</span>
          </div>

          <nav className="flex items-center gap-6 text-sm">
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Help
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms & Privacy
            </a>
          </nav>
        </div>

        <div className="mt-6 pt-6 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by AI and blockchain technology for your safety and
            security.
          </p>
        </div>
      </div>
    </footer>
  );
}
