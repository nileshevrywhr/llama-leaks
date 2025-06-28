import { AlertTriangle } from "lucide-react";

const WarningBanner = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-3 shadow-md">
      <div className="container mx-auto flex items-center justify-center space-x-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          Your Ollama server is probably exposed right now
        </span>
      </div>
    </div>
  );
};

export default WarningBanner;