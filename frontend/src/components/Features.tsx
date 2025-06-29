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
        <p className="text-muted-foreground text-base max-w-xl mx-auto">
          *Don't worry, you're not alone. Thousands of developers are making the same mistake 
          right now. Yes, even the one sitting next to you who claims to be a "security expert."
        </p>
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
      
      <div className="mt-12 p-8 bg-gradient-to-br from-blue-500/5 to-primary/5 border border-blue-500/20 rounded-xl">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              How to Actually Secure Your Server
            </h3>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              Stop being part of the problem. Here are the security measures you should implement right now:
            </p>
          </div>
          
          {/* Quick Fixes Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-blue-600 dark:text-blue-400">Quick Fixes (Do These Now)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Wifi className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-blue-700 dark:text-blue-300">Bind to localhost only</div>
                    <div className="text-xs text-muted-foreground">(127.0.0.1:11434)</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-blue-700 dark:text-blue-300">Use reverse proxy</div>
                    <div className="text-xs text-muted-foreground">with authentication</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-blue-700 dark:text-blue-300">Set up firewall rules</div>
                    <div className="text-xs text-muted-foreground">Block unnecessary ports</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-blue-700 dark:text-blue-300">Monitor access logs</div>
                    <div className="text-xs text-muted-foreground">Check regularly</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Proper Solutions Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-blue-600 dark:text-blue-400">Proper Solutions</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-primary/10 to-blue-500/10 hover:from-primary/20 hover:to-blue-500/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-primary">API key authentication</div>
                    <div className="text-xs text-muted-foreground">Secure your endpoints</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-primary/10 to-blue-500/10 hover:from-primary/20 hover:to-blue-500/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-primary">Use VPN for remote access</div>
                    <div className="text-xs text-muted-foreground">Secure tunneling</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-primary/10 to-blue-500/10 hover:from-primary/20 hover:to-blue-500/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Gauge className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-primary">Set up rate limiting</div>
                    <div className="text-xs text-muted-foreground">Control request frequency</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative overflow-hidden rounded-lg border border-blue-500/20 bg-gradient-to-r from-primary/10 to-blue-500/10 hover:from-primary/20 hover:to-blue-500/20 transition-all duration-200 shadow-md hover:shadow-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Search className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-primary">Regular security audits</div>
                    <div className="text-xs text-muted-foreground">Stay vigilant</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-blue-500/20">
            <p className="font-medium">🛡️ Security is not optional in production environments.</p>
            <p>Implement these measures before your server becomes another statistic on this wall.</p>
          </div>
        </div>
      </div>
      
      <div id="solutions" className="scroll-mt-24"></div>
    </section>
  );
};

export default Features;