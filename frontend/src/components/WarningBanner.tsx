import { AlertTriangle } from "lucide-react";

const WarningBanner = () => {
  return (
    <div className="fixed top-14 left-0 right-0 z-40 bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm font-medium text-center">
          Your Ollama server is probably exposed right now
        </p>
      </div>
    </div>
  );
};

export default WarningBanner;