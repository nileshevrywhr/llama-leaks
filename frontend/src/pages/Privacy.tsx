import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import BoltBadge from "@/components/BoltBadge";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WarningBanner />
      <BoltBadge />
      
      <div className="pt-[88px] px-4">
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="space-y-1 text-muted-foreground text-lg">
                <p>We collect nothing</p>
                <p>Your data stays with you always</p>
                <p>Privacy by design</p>
              </div>
            </div>

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
      
      <Footer />
    </div>
  );
};

export default Privacy;