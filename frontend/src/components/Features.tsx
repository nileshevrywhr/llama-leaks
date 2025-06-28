
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Eye, Lock, Globe, Clock } from "lucide-react";

const Features = () => {
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

  return (
    <section id="features" className="container py-24 space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Why Your Ollama Server is a Security Nightmare*
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          *Don't worry, you're not alone. Thousands of developers are making the same mistake 
          right now. Yes, even the one sitting next to you who claims to be a "security expert."
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index} className="transition-all hover:shadow-lg border-destructive/15 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-destructive/8 rounded-lg w-fit">
                  {feature.icon}
                </div>
                <Badge variant="destructive">{feature.badge}</Badge>
              </div>
              <CardTitle className="text-xl">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 p-6 bg-destructive/5 border border-destructive/20 rounded-lg">
        <h3 className="text-xl font-semibold mb-4 text-destructive">How to Actually Secure Your Server</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-medium mb-2">Quick Fixes (Do These Now):</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Bind to localhost only (127.0.0.1:11434)</li>
              <li>• Use a reverse proxy with authentication</li>
              <li>• Set up firewall rules</li>
              <li>• Monitor access logs regularly</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Proper Solutions:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Implement API key authentication</li>
              <li>• Use VPN for remote access</li>
              <li>• Set up rate limiting</li>
              <li>• Regular security audits</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
