import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import ModelExecutionDashboard from "@/components/ModelExecutionDashboard";
import Footer from "@/components/Footer";

const Models = () => {
  return (
    <div className="min-h-screen bg-background pt-[88px]">
      <Header />
      <WarningBanner />
      <ModelExecutionDashboard />
      <Footer />
    </div>
  );
};

export default Models;