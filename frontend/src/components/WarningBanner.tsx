import { AlertTriangle } from "lucide-react";

const WarningBanner = () => {
  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-red-600 text-white px-2 py-2 shadow-md">
      <div className="flex items-center justify-center space-x-2 w-full">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
          Your Ollama server might be exposed right now
        </span>
      </div>
    </div>
  );
};

export default WarningBanner;