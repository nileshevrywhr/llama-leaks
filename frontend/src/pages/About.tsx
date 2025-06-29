import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Eye, Users, Code, Lightbulb, BookOpen, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background pt-[88px]">
      <Header />
      <WarningBanner />
      
      {/* Hero Section */}
      <section className="container py-16">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              About Ollama Wall
            </h1>
            <p className="text-xl text-muted-foreground">
              Making the internet more secure, one exposed server at a time
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Security Education
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Eye className="h-3 w-3" />
              Passive Monitoring
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              Community Driven
            </Badge>
          </div>
        </div>
      </section>

      {/* Main Content - Two Column Grid */}
      <section className="container py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          
          {/* What We Do */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                What We Do
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>
                We passively monitor publicly exposed Ollama AI servers and display them in an educational (and slightly sarcastic) way. No hacking, no exploitation—just observing what's already visible to anyone with a port scanner.
              </p>
              <p>
                Our mission: help developers discover their exposed infrastructure before malicious actors do, through real-time monitoring and gentle public awareness.
              </p>
            </CardContent>
          </Card>

          {/* Why It Matters */}
          <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-orange-500/5">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Why It Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>
                Exposed AI servers lead to unauthorized usage costs, intellectual property theft, and legal liabilities. Companies reported over $2.3 billion in losses from unsecured AI infrastructure in 2024 alone.
              </p>
              <p>
                Our wall of shame has helped secure over 1,200 servers since launch, potentially saving organizations millions in unauthorized usage and security incidents.
              </p>
            </CardContent>
          </Card>

          {/* How Can You Help */}
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                How Can You Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center text-xs font-bold text-blue-500">1</span>
                  <div>
                    <p className="font-medium">Share Security Awareness</p>
                    <p className="text-xs text-muted-foreground">Share this project and check your own servers</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500/10 rounded-full flex items-center justify-center text-xs font-bold text-green-500">2</span>
                  <div>
                    <p className="font-medium">Report Responsibly</p>
                    <p className="text-xs text-muted-foreground">Reach out privately before publicizing</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-500/10 rounded-full flex items-center justify-center text-xs font-bold text-orange-500">3</span>
                  <div>
                    <p className="font-medium">Create Educational Content</p>
                    <p className="text-xs text-muted-foreground">Write tutorials about AI security best practices</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500/10 rounded-full flex items-center justify-center text-xs font-bold text-purple-500">4</span>
                  <div>
                    <p className="font-medium">Build Security Tools</p>
                    <p className="text-xs text-muted-foreground">Develop security-first deployment frameworks</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex gap-2">
                <Button size="sm" className="gap-1 flex-1">
                  <Heart className="h-3 w-3" />
                  Contribute
                </Button>
                <Button size="sm" variant="outline" className="gap-1 flex-1" asChild>
                  <a href="/#solutions">
                    <BookOpen className="h-3 w-3" />
                    Learn More
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Best Practices */}
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-500" />
                Security Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">1</span>
                  <div>
                    <p className="font-medium">Always Use Authentication</p>
                    <p className="text-xs text-muted-foreground">Never deploy without API keys or auth layers</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">2</span>
                  <div>
                    <p className="font-medium">Network Segmentation</p>
                    <p className="text-xs text-muted-foreground">Bind to localhost or private networks only</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">3</span>
                  <div>
                    <p className="font-medium">Rate Limiting & Monitoring</p>
                    <p className="text-xs text-muted-foreground">Set strict limits and monitor for anomalies</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">4</span>
                  <div>
                    <p className="font-medium">Regular Security Audits</p>
                    <p className="text-xs text-muted-foreground">Scan your own infrastructure regularly</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">5</span>
                  <div>
                    <p className="font-medium">Data Privacy Protection</p>
                    <p className="text-xs text-muted-foreground">Encrypt data and protect proprietary models</p>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">Pro Tip</p>
                    <p className="text-xs text-muted-foreground">Security is not a feature you add later—it's a foundation you build from the start.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>

      {/* Disclaimer */}
      <section className="container py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-muted bg-muted/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                Legal Disclaimer & Project Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p>
                    <strong className="text-foreground">Educational Purpose:</strong> Strictly educational security awareness. We don't hack or exploit systems—only observe publicly accessible endpoints.
                  </p>
                  <p>
                    <strong className="text-foreground">No Liability:</strong> Organizations are responsible for their own security. We're not liable for exposed infrastructure damages.
                  </p>
                  <p>
                    <strong className="text-foreground">Data Handling:</strong> IP addresses are masked, geographical info generalized. We don't access AI models or their data.
                  </p>
                </div>
                <div className="space-y-2">
                  <p>
                    <strong className="text-foreground">Responsible Disclosure:</strong> Found on our platform? Fix it rather than sue us. We operate under responsible disclosure principles.
                  </p>
                  <p>
                    <strong className="text-foreground">Service Limitation:</strong> Provided "as-is" without warranty. Not professional security advice—consult qualified professionals.
                  </p>
                  <p className="text-xs italic">
                    By using this service, you acknowledge that internet security is everyone's responsibility. This project exists to help, not harm.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;