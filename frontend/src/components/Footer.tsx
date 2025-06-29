
import { Separator } from "@/components/ui/separator";
import { Github, Twitter, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground max-w-xs space-y-2">
              <p className="font-bold">
                Zero security. No asterisks.
              </p>
              <p>
                We reveal exposed endpoints to encourage better security practices.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Security Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Ollama Security Guide</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Server Hardening Tips</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Vulnerability Reports</a></li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Tools & Scanners</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Server Scanner</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Security Checker</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Monitoring Tools</a></li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Get Help</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Security Audit</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Emergency Response</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Professional Support</a></li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-8" />
        
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            © 2024 Ollama Wall. Saving servers from themselves since developers stopped caring about security.
          </p>
          
          <div className="flex items-center space-x-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Shield className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
