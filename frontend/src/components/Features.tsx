import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Eye, Lock, Globe, Clock, Wifi, Server, ShieldCheck, Activity, Key, VpnIcon, Gauge, Search } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ResponsiveCarouselIndicators from "./ResponsiveCarouselIndicators";
import { useEffect, useState } from "react";

const Features = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const features = [
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: "Completely Exposed",
      description: "Your Ollama server is probably accessible to everyone right now. Congratulations, you've created a public AI service!",
      badge: "Concerning"
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Visible to All",
      description: "Anyone can see your models, query them, and potentially abuse your resources. It's like leaving your front door open with a sign saying 'Free Stuff Inside'.",
      badge: "Obvious"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Internet Famous",
      description: "Your server is discoverable by anyone scanning the internet. You're basically a celebrity now, just not the good kind.",
      badge: "Unfortunate"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Zero Authentication",
      description: "No passwords, no API keys, no nothing. It's refreshingly insecure in a world obsessed with security theater.",
      badge: "Liberating"
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Easy to Abuse",
      description: "Malicious actors can use your models for harmful content generation. But hey, at least you're contributing to the chaos!",
      badge: "Generous"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "24/7 Availability",
      description: "Your server works harder than you do, serving requests around the clock. Too bad you're not getting paid for it.",
      badge: "Dedicated"
    }
  ];

  const FeatureCard = ({ feature, index }: { feature: typeof features[0], index: number }) => (
    <Card className="relative transition-all hover:shadow-lg border-destructive/20 h-full">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg w-fit">
            {feature.icon}
          </div>
          <CardTitle className="text-xl">{feature.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-relaxed">
          {feature.description}
        </CardDescription>
      </CardContent>
      <Badge variant="destructive" className="absolute bottom-4 right-4">{feature.badge}</Badge>
    </Card>
  );

  return (
    <section id="features" className="container py-24 space-y-8">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
          Why Your Ollama Server is a Security Nightmare*
        </h3>
        <div className="text-muted-foreground text-base max-w-2xl mx-auto space-y-1">
          <p className="text-center">
            *Don't worry, you're not alone. Thousands of developers are making the same mistake right now.
          </p>
          <p className="text-center">
            Yes, even the one sitting next to you who claims to be a "security expert."
          </p>
        </div>
      </div>
      
      {/* Mobile Carousel */}
      <div className="md:hidden">
        <Carousel
          className="w-full"
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {features.map((feature, index) => (
              <CarouselItem 
                key={index} 
                className="pl-2 md:pl-4 basis-[85%] sm:basis-[70%]"
              >
                <div className="h-full">
                  <FeatureCard feature={feature} index={index} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <ResponsiveCarouselIndicators />
        </Carousel>
      </div>

      {/* Desktop Grid */}
      <div className="hidden md:grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} />
        ))}
      </div>
      
    </section>
  );
};

export default Features;