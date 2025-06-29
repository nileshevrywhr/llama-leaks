import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WarningBanner />
      
      <div className="pt-[88px] min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto space-y-8">
          {/* Error Icon and Title */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-destructive/10 rounded-full">
                <AlertTriangle className="h-16 w-16 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-bold text-destructive">
                404
              </h1>
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">
                Page Not Found
              </h2>
            </div>
          </div>

          {/* Self-Deprecating Haiku */}
          <div className="p-6 bg-muted/50 rounded-lg border border-destructive/20">
            <h3 className="text-lg font-medium text-foreground mb-4">
              A Haiku of Shame
            </h3>
            <div className="space-y-1 text-muted-foreground italic">
              <p>Page not found here</p>
              <p>I probably messed up routing</p>
              <p>Blame the developer</p>
            </div>
            <div className="text-xs text-muted-foreground/70 mt-3">
              — Self-deprecating poetry by yours truly
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <p className="text-lg text-muted-foreground">
              Well, this is embarrassing. You've stumbled upon a page that doesn't exist.
            </p>
            <p className="text-base text-muted-foreground">
              Either you typed something wrong, clicked a broken link, or I messed up the routing. 
              Given my track record with securing Ollama servers, it's probably the latter.
            </p>
          </div>

          {/* Navigation Options */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg" 
              className="gap-2"
            >
              <a href="/">
                <Home className="h-5 w-5" />
                Back to Home
              </a>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              Go Back
            </Button>
          </div>

          {/* Additional Help */}
          <div className="text-sm text-muted-foreground border-t border-border pt-6">
            <p>
              If you think this page should exist, maybe I forgot to build it. 
              Wouldn't be the first time I've forgotten something important.
            </p>
            <p className="mt-2">
              <span className="font-medium">Attempted URL:</span>{" "}
              <code className="bg-muted px-2 py-1 rounded text-xs">
                {location.pathname}
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;