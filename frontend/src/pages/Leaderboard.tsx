import * as Sentry from "@sentry/react";
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import VersionLeaderboard from "@/components/VersionLeaderboard";
import Footer from "@/components/Footer";

const Leaderboard = () => {
  return (
    <div className="min-h-screen bg-background pt-[88px]">
      <Header />
      <WarningBanner />
      <VersionLeaderboard />
      <Footer />
    </div>
  );
};

export default Sentry.withSentryRouting(Leaderboard);