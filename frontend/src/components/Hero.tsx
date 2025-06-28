
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, AlertTriangle } from "lucide-react";

const Hero = () => {
  return (
    <section className="container flex flex-col items-center justify-center space-y-6 py-16 md:py-20 mt-4">
      <h1 className="text-2xl font-bold leading-tight tracking-tighter md:text-4xl lg:text-5xl lg:leading-[1.1] text-center max-w-3xl">
        Your Ollama Server is Now a{" "}
        <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
          Public AI Playground
        </span>
      </h1>
      
      <p className="max-w-xl text-center text-base text-muted-foreground md:text-lg">
        Your server is cheerfully serving AI requests to the entire internet. 
        No authentication required. Here's proof:
      </p>
    </section>
  );
};

export default Hero;
