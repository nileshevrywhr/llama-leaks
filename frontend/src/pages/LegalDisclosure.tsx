import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";

const LegalDisclosure = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WarningBanner />
      
      <div className="pt-[88px] min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <div className="space-y-1 text-muted-foreground text-lg">
              <p>Legal stuff is boring</p>
              <p>Lawyers made us write this page</p>
              <p>Don't sue us, please thanks</p>
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
  );
};

export default LegalDisclosure;