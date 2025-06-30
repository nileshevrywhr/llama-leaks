
import { Separator } from "@/components/ui/separator";
import { Github, Twitter, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Bolt Badge */}
          <div className="flex items-center justify-center md:order-2">
            <a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
              aria-label="Powered by Bolt"
            >
              <img 
                src="/logotext_poweredby_360w.png" 
                alt="Powered by Bolt" 
                className="h-8 w-auto"
              />
            </a>
          </div>
          
          {/* Copyright */}
          <div className="md:order-1">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              Copyright © {new Date().getFullYear()} Banana Labs Inc.
            </p>
          </div>
          
          {/* Links */}
          <div className="md:order-3">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition-colors">
                privacy policy
              </a>
              <span>|</span>
              <a href="/legal" className="hover:text-foreground transition-colors">
                legal disclosure
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Copyright © {new Date().getFullYear()} Banana Labs Inc.
          </p>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <a href="/privacy" className="hover:text-foreground transition-colors">
              privacy policy
            </a>
            <span>|</span>
            <a href="/legal" className="hover:text-foreground transition-colors">
              legal disclosure
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
