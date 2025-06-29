import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
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
        <div className="text-center space-y-8">
          {/* Self-Deprecating Haiku */}
          <div className="space-y-4">
            <div className="space-y-1 text-muted-foreground text-lg">
              <p>Page not found here</p>
              <p>I probably messed up routing</p>
              <p>Blame the developer</p>
            </div>
          </div>

          {/* Home Button */}
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
        </div>
      </div>
    </div>
  );
};

export default Sentry.withSentryRouting(NotFound);