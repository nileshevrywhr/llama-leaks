
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import Hero from "@/components/Hero";
import ServerStats from "@/components/ServerStats";
import Features from "@/components/Features";
import Solutions from "@/components/Solutions";
import Footer from "@/components/Footer";
import SentryTestButton from "@/components/SentryTestButton";

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
      
      {/* Remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <SentryTestButton />
        </div>
      )}
    </div>
  );
};

export default Index;
