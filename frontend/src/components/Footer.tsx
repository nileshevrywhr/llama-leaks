
import { Separator } from "@/components/ui/separator";
import { Github, Twitter, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="flex justify-center">
          <div className="space-y-3 text-center">
            <div className="text-sm text-muted-foreground max-w-xs space-y-2">
              <p className="font-bold">
                Zero security. No asterisks.
              </p>
              <p className="whitespace-nowrap">
                We reveal exposed endpoints to encourage better security practices.
              </p>
            </div>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
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
