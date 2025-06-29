
import { Separator } from "@/components/ui/separator";
import { Github, Twitter, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} Banana Labs Inc.
          </p>
          
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <a href="/privacy-policy" className="hover:text-foreground transition-colors">
              privacy policy
            </a>
            <span>|</span>
            <a href="/legal-disclosure" className="hover:text-foreground transition-colors">
              legal disclosure
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
