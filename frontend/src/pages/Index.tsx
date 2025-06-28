
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import Hero from "@/components/Hero";
import ServerStats from "@/components/ServerStats";
import LocationInfo from "@/components/LocationInfo";
import Features from "@/components/Features";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background pt-[88px]">
      <Header />
      <WarningBanner />
      <Hero />
      <ServerStats />
      <LocationInfo />
      <Features />
      <Footer />
    </div>
  );
};

export default Index;
