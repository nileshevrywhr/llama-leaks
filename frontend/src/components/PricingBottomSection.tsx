import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Coffee, Heart } from "lucide-react";

const PricingBottomSection = () => {
  const faqs = [
    {
      question: "Is this really free?",
      answer: "Yes! This is a passion project to help improve web security. No hidden costs, no premium tiers, no enterprise nonsense."
    },
    {
      question: "What's the catch?",
      answer: "There isn't one. Just help make the web more secure by reporting exposed keys when you find them."
    },
    {
      question: "Can I donate?",
      answer: "That's very kind! Instead of donating money, just spread the word about good security practices to your fellow developers."
    },
    {
      question: "Will you add paid features?",
      answer: "Highly unlikely. The core mission of helping secure exposed API keys should remain free and accessible to everyone."
    }
  ];

  return (
    <section className="container py-24">
      {/* FAQ Section */}
      <div className="text-center space-y-4 mb-16">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Frequently Asked Questions 🤔
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Because apparently giving away free security tools is suspicious in 2025
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
        {faqs.map((faq, index) => (
          <Card key={index} className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">{faq.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reality Check Section */}
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
            <Coffee className="h-5 w-5" />
            The Real Cost 💬
          </h3>
          
          <div className="space-y-4 text-muted-foreground">
            <p>
              While our service is free, exposed AI servers can cost developers and companies thousands of dollars in unauthorized usage, security breaches, and remediation efforts. Plus the inevitable "how did this happen" meeting with your boss that nobody wants to attend.
            </p>
            
            <p>
              We're not trying to scare you (okay, maybe a little), but leaving your Ollama server wide open is like putting a "Free AI Models - Help Yourself!" sign on the internet. Spoiler alert: people will help themselves, and they won't be polite about it.
            </p>
            
            <p>
              Help us prevent these costs by responsibly securing your servers and maybe, just maybe, reading the documentation before deploying to production. Your future self will thank you, and so will your security team.
            </p>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-red-500" />
            <span className="font-semibold">Together, we can make the web a more secure place!</span>
            <Shield className="h-5 w-5 text-blue-500" />
          </div>
          
          <p className="text-sm text-muted-foreground mb-6">
            Join thousands of developers who've already started securing their AI deployments. 
            It's easier than explaining to your team why the server bill tripled overnight.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2">
              <Shield className="h-5 w-5" />
              Start Your Security Journey
            </Button>
            
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="#solutions">
                <AlertTriangle className="h-5 w-5" />
                Learn How to Secure Servers
              </a>
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 <strong>Pro tip:</strong> Reading security documentation is like flossing — everyone knows they should do it, but most people don't until there's a problem.</p>
          <p>🎯 <strong>Another tip:</strong> "It works on my machine" is not a security strategy.</p>
        </div>
      </div>
    </section>
  );
};

export default PricingBottomSection;