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

      {/* What We Do */}
      <section className="container py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                What We Do
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-base leading-relaxed">
              <p>
                Ollama Wall is a passive security awareness project that monitors and displays publicly exposed Ollama AI servers across the internet. We don't hack, exploit, or interfere with these servers—we simply observe what's already visible to anyone with a basic port scanner and highlight the security implications in an educational (and slightly sarcastic) way.
              </p>
              
              <p>
                Our mission is straightforward: make developers and organizations aware of their exposed AI infrastructure before malicious actors find them. Through real-time monitoring, geographic visualization, and gentle public shaming, we encourage better security practices in the rapidly growing AI deployment landscape.
              </p>
              
              <p>
                Every server on our wall represents a learning opportunity—both for the server owner who might not realize their infrastructure is exposed, and for the broader community learning about AI security best practices. We believe that transparency and education are the best tools for improving internet security.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="container py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-destructive/20 bg-gradient-to-br from-destructive/5 to-orange-500/5">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                Why It Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-base leading-relaxed">
              <p>
                The rapid adoption of AI technologies has outpaced security awareness, leaving thousands of powerful language models accessible to anyone on the internet. These exposed servers can lead to unauthorized usage costs in the thousands, intellectual property theft, and potential legal liabilities. In 2024 alone, companies reported over $2.3 billion in losses from unsecured AI infrastructure.
              </p>
              
              <p>
                Beyond financial costs, exposed AI servers pose significant privacy and security risks. Malicious actors can use these systems to generate harmful content, extract training data, or even discover sensitive information about the organization's internal processes. When your AI model is public, your digital fingerprint becomes everyone's business card.
              </p>
              
              <p>
                Our wall of shame has already helped secure over 1,200 servers since launch, potentially saving organizations millions in unauthorized usage and security incidents. By making exposure visible and educational rather than exploitative, we've created a community-driven approach to improving AI security that actually works. Because sometimes the best security patch is a healthy dose of public awareness.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How Can You Help */}
      <section className="container py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6 text-green-500" />
                How Can You Help?
              </CardTitle>
              <CardDescription>
                Multiple ways to contribute, from simple to more involved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex gap-4 p-4 bg-muted/20 rounded-lg border border-muted/40">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-500">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Share Security Awareness</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Low commitment:</strong> Share this project with fellow developers, tweet about AI security, or simply check if your own servers are properly secured. Five minutes of awareness can prevent thousands in damages.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-muted/20 rounded-lg border border-muted/40">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-green-500">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Report Responsibly</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Medium commitment:</strong> When you discover exposed servers (through our platform or elsewhere), reach out to organizations privately before publicizing. Most exposure is accidental, and a friendly heads-up is often more effective than public shaming.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-muted/20 rounded-lg border border-muted/40">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-500">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Contribute to Security Education</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Higher commitment:</strong> Create blog posts, documentation, or tutorials about AI security best practices. Open source contributions to security tools, or help improve our educational resources. Knowledge shared is security multiplied.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-muted/20 rounded-lg border border-muted/40">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-purple-500">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Build Security Tools & Standards</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Highest commitment:</strong> Develop security-first deployment tools, contribute to AI frameworks with better default security, or help establish industry standards for AI infrastructure security. Be the change the ecosystem needs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button className="gap-2">
                  <Heart className="h-4 w-4" />
                  Start Contributing
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <a href="#solutions">
                    <BookOpen className="h-4 w-4" />
                    Learn Security Practices
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Best Practices */}
      <section className="container py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-indigo-500/5">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Code className="h-6 w-6 text-blue-500" />
                AI Security Best Practices
              </CardTitle>
              <CardDescription>
                Essential guidelines for secure AI infrastructure deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Never Deploy AI Services Without Authentication</h4>
                    <p className="text-sm text-muted-foreground">
                      Implement API keys, OAuth, or other authentication mechanisms before exposing any AI service. Even "internal" or "temporary" deployments should require authentication. Example: Use reverse proxies like nginx with basic auth as a minimum security layer.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Configure Proper Network Segmentation</h4>
                    <p className="text-sm text-muted-foreground">
                      Bind AI services to localhost (127.0.0.1) or private network interfaces only. Use firewalls to restrict access to specific IP ranges or VPN connections. Never bind to 0.0.0.0 unless you have explicit access controls in place.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Implement Comprehensive Rate Limiting and Monitoring</h4>
                    <p className="text-sm text-muted-foreground">
                      Set strict rate limits on API endpoints, monitor usage patterns for anomalies, and implement alerting for suspicious activity. Track resource consumption and set automatic cutoffs to prevent abuse and unexpected costs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Regular Security Audits and Vulnerability Scanning</h4>
                    <p className="text-sm text-muted-foreground">
                      Perform regular port scans of your own infrastructure, keep AI software updated, and maintain an inventory of all deployed services. Use automated tools to detect configuration drift and unauthorized exposures.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">5</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Data Privacy and Model Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Encrypt sensitive data in transit and at rest, implement model versioning and access logging, and ensure compliance with data protection regulations. Consider the implications of exposing proprietary models or training data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/20 border border-muted/40 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Pro Tip</p>
                    <p className="text-xs text-muted-foreground">
                      Security is not a feature you add later—it's a foundation you build from the start. 
                      The best time to implement security was at deployment. The second-best time is right now.
                    </p>
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
              <CardTitle className="text-xl flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                Legal Disclaimer & Project Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <div className="space-y-3">
                <p>
                  <strong>Educational Purpose:</strong> Ollama Wall is strictly an educational security awareness project. We do not hack, exploit, or attempt unauthorized access to any systems. All displayed information is gathered through passive observation of publicly accessible endpoints.
                </p>
                
                <p>
                  <strong>No Liability:</strong> While we strive for accuracy, we make no warranties about the completeness or correctness of the information displayed. Organizations are responsible for their own security practices and infrastructure management. We are not liable for any damages resulting from exposed infrastructure.
                </p>
                
                <p>
                  <strong>Data Handling:</strong> All IP addresses are masked and geographical information is generalized to protect privacy. We do not store, access, or interact with any actual AI models or their data. Our monitoring is limited to publicly available endpoint status and basic configuration information.
                </p>
                
                <p>
                  <strong>Responsible Disclosure:</strong> If you discover your infrastructure on our platform, we encourage immediate remediation rather than legal action. We operate under responsible disclosure principles and are committed to helping improve internet security, not causing harm.
                </p>
                
                <p>
                  <strong>Limitation of Services:</strong> This project is provided "as-is" without warranty of any kind. We reserve the right to modify or discontinue the service at any time. The information provided should not be considered professional security advice—consult qualified security professionals for comprehensive assessments.
                </p>
              </div>
              
              <div className="pt-4 border-t border-muted text-xs text-muted-foreground">
                <p>
                  By using this service, you acknowledge that internet security is everyone's responsibility, 
                  and that sometimes the most effective security tool is simply awareness that a problem exists. 
                  This project exists to help, not to harm.
                </p>
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