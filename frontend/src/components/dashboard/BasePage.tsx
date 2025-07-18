import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const DashboardHeader = () => {
    return (
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Model Execution Dashboard 🚀
        </h2>

        {/* Haiku */}
        <div className="max-w-md mx-auto p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
          <div className="text-sm font-mono text-muted-foreground italic leading-relaxed">
            No keys, no limits here.
            AI models run wild and free.
            Internet's playground.
          </div>
        </div>

        {/* Body copy */}
        <div className="text-muted-foreground max-w-3xl mx-auto space-y-2">
          <p className="text-sm font-mono italic leading-relaxed">
            "Choose your AI model!"
            Developers cry, you click
            Who made this dashboard?
          </p>
        </div>
      </div>
    );
  };

const LoadingSpinner = () => {
    return (
      <section className="container py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Model Execution Dashboard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Loading model execution data across all servers...
          </p>
        </div>

        <div className="space-y-4 max-w-6xl mx-auto">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="relative p-6 rounded-lg border backdrop-blur-sm bg-muted/20 border-muted animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-6 bg-muted rounded w-32"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  interface ErrorMessageProps {
    error: string;
    retry: () => void;
  }

  const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, retry }) => {
    return (
      <section className="container py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl mb-4">
            Model Execution Dashboard
          </h2>
          <p className="text-destructive mb-2">Failed to load model execution data</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button onClick={retry} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </section>
    );
  };

interface BasePageProps {
    children: React.ReactNode;
    loading: boolean;
    error: string | null;
    retry: () => void;
  }

const BasePage: React.FC<BasePageProps> = ({ children, loading, error, retry }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage error={error} retry={retry} />;
  }

  return (
    <section className="container py-16">
      <DashboardHeader />
      {children}
    </section>
  );
};

export default BasePage;
