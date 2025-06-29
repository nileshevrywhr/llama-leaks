import * as Sentry from "@sentry/react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import PricingTiers from "@/components/PricingTiers";
import PricingBottomSection from "@/components/PricingBottomSection";
import Footer from "@/components/Footer";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background pt-[88px]">
      <Header />
      <WarningBanner />
      <PricingTiers />
      <PricingBottomSection />
      <Footer />
    </div>
  );
};

export default Sentry.withSentryRouting(Pricing);