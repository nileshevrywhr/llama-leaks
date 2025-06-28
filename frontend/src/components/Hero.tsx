
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, AlertTriangle } from "lucide-react";

const Hero = () => {
  return (
    <section className="container flex flex-col items-center justify-center space-y-4 py-24 md:py-32 mt-4">
      <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1] text-center max-w-4xl">
        Congratulations! Your Ollama Server is Now a{" "}
        <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
          Public AI Playground
        </span>{" "}
        (And You Didn't Even Know It)
      </h1>
      
      <p className="max-w-2xl text-center text-lg text-muted-foreground md:text-xl">
        Yes, you—the one reading this while your server cheerfully serves AI requests 
        to every corner of the internet. Don't worry, we're not judging. Actually, 
        we are. A little bit. Okay, a lot.
      </p>
      
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button size="lg" className="gap-2">
          <Shield className="h-4 w-4" />
          Check My Shame Level
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="lg">
          Fix This Mess (Please)
        </Button>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          "Security? I thought that was a browser warning I could ignore!" - You, probably
        </p>
      </div>
    </section>
  );
};

export default Hero;
