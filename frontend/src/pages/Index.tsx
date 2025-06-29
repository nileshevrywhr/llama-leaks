
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import * as Sentry from "@sentry/react";
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import Hero from "@/components/Hero";
import ServerStats from "@/components/ServerStats";
import Features from "@/components/Features";
import Solutions from "@/components/Solutions";
import Footer from "@/components/Footer";

const Index = () => {
  const location = useLocation();

  // Handle hash scrolling when navigating to homepage with hash
  useEffect(() => {
    if (location.hash) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(location.hash.slice(1));
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background pt-[88px]">
      <Header />
      <WarningBanner />
      <Hero />
      <ServerStats />
      <Features />
      <Solutions />
      <Footer />
    </div>
  );
};

export default Sentry.withSentryRouting(Index);
