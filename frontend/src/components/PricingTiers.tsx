import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle, Crown, Zap, Shield } from "lucide-react";

const PricingTiers = () => {
  const tiers = [
    {
      name: "Basically Free",
      subtitle: "Perfect for security enthusiasts who like free things",
      price: "$0",
      period: "forever",
      badge: "Most Popular",
      badgeColor: "bg-blue-500",
      icon: <Shield className="h-6 w-6" />,
      gradient: "from-blue-500/10 to-blue-600/10 border-blue-500/20",
      features: [
        "Live wall of shame viewing",
        "Real-time server exposure alerts", 
        "Basic geographic heat maps",
        "Version vulnerability tracking"
      ],
      constraint: "Must high-five a stranger daily",
      bonus: "Free existential dread about internet security",
      ctaText: "Start Judging Servers",
      ctaVariant: "default" as const
    },
    {
      name: "Still Somehow Free", 
      subtitle: "Everything from Basically Free, plus premium denial",
      price: "$0",
      period: "still forever",
      badge: "Best Value",
      badgeColor: "bg-green-500",
      icon: <Zap className="h-6 w-6" />,
      gradient: "from-green-500/10 to-green-600/10 border-green-500/20",
      features: [
        "Everything from Basically Free",
        "Advanced sarcasm engine",
        "Custom server shaming notifications",
        "Priority access to security haikus"
      ],
      constraint: "Must whisper 'security first' to your houseplants",
      guarantee: "100% guarantee that your servers won't magically secure themselves",
      bonus: "Exclusive access to our 'Hall of Shame' Discord",
      ctaText: "Upgrade to Nothing",
      ctaVariant: "outline" as const
    },
    {
      name: "Suspiciously Free",
      subtitle: "Everything above + VIP treatment (still $0 though)",
      price: "$0", 
      period: "perpetually",
      badge: "Enterprise",
      badgeColor: "bg-purple-500",
      icon: <Crown className="h-6 w-6" />,
      gradient: "from-purple-500/10 to-purple-600/10 border-purple-500/20",
      features: [
        "Everything from previous tiers",
        "Personal security consultant (it's just a chatbot)",
        "Custom domain for your shame wall",
        "Early access to new security nightmares"
      ],
      constraint: "Must submit a 500-word essay on why you deserve free stuff",
      vipPerk: "Direct line to our CEO (spoiler: there is no CEO)",
      condition: "Only available on days ending in 'y' during months with the letter 'r'",
      ctaText: "Join the Elite (Free)",
      ctaVariant: "default" as const
    }
  ];

  return (
    <section className="container py-24">
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Pricing
        </h2>
        <div className="text-muted-foreground text-lg max-w-3xl mx-auto space-y-2">
          <p>Simple, transparent, and completely free</p>
          <p className="italic">Because security shouldn't cost a fortune 💸</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier, index) => (
          <Card 
            key={tier.name}
            className={`relative group overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br ${tier.gradient}`}
          >
            {tier.badge && (
              <div className="absolute top-4 right-4">
                <Badge className={`${tier.badgeColor} text-white`}>
                  {tier.badge}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                {tier.icon}
              </div>
              <CardTitle className="text-2xl mb-2">{tier.name}</CardTitle>
              <CardDescription className="text-sm">
                {tier.subtitle}
              </CardDescription>
              
              <div className="mt-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">/{tier.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  No hidden fees, no credit card, no dignity required
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features */}
              <div className="space-y-3">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Constraint */}
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Silly Requirement:</p>
                    <p className="text-xs text-muted-foreground">{tier.constraint}</p>
                  </div>
                </div>
              </div>

              {/* Guarantee (Tier 2) */}
              {tier.guarantee && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    🛡️ Our Promise:
                  </p>
                  <p className="text-xs text-muted-foreground">{tier.guarantee}</p>
                </div>
              )}

              {/* VIP Condition (Tier 3) */}
              {tier.condition && (
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                    📋 Special Condition:
                  </p>
                  <p className="text-xs text-muted-foreground">{tier.condition}</p>
                </div>
              )}

              {/* Bonus/VIP Perk */}
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium text-primary">
                  🎁 {tier.vipPerk ? 'VIP Perk:' : 'Bonus:'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {tier.vipPerk || tier.bonus}
                </p>
              </div>

              {/* CTA Button */}
              <Button 
                className="w-full" 
                variant={tier.ctaVariant}
                size="lg"
              >
                {tier.ctaText}
              </Button>

              {/* Fine Print */}
              <p className="text-xs text-center text-muted-foreground">
                *Terms and conditions apply. Mostly the absurd ones listed above.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-16 space-y-4">
        <h3 className="text-xl font-semibold">
          Still not convinced? That's concerning.
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          All tiers include the same level of existential security awareness and the 
          gradual realization that maybe, just maybe, you should secure your servers.
        </p>
        <div className="pt-4">
          <Button size="lg" className="gap-2">
            <Shield className="h-5 w-5" />
            Start Your Free Security Enlightenment
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingTiers;