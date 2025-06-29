
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import Hero from "@/components/Hero";
import ServerStats from "@/components/ServerStats";
import Features from "@/components/Features";
import Solutions from "@/components/Solutions";
import Footer from "@/components/Footer";

const Index = () => {
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

export default Index;
