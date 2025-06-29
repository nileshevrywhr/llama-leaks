import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, createRoutesFromElements, RouterProvider, Route } from "react-router-dom";
import * as Sentry from "@sentry/react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Leaderboard from "./pages/Leaderboard";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Legal from "./pages/Legal";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  Sentry.withSentryRouting(
    createRoutesFromElements(
      <>
        <Route path="/" element={<Index />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/legal" element={<Legal />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </>
    )
  )
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;