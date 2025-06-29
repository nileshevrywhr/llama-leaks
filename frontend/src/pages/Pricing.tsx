import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import PricingTiers from "@/components/PricingTiers";
import Footer from "@/components/Footer";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background pt-[88px]">
      <Header />
      <WarningBanner />
      <PricingTiers />
      <Footer />
    </div>
  );
};

export default Pricing;