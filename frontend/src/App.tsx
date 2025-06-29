import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { withSentryReactRouterV6Routing } from "@sentry/react";
import {
  createBrowserRouter, 
  RouterProvider,
  createRoutesFromChildren,
  Route
} from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Leaderboard from "./pages/Leaderboard";
import Pricing from "./pages/Pricing";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/leaderboard",
    element: <Leaderboard />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/privacy",
    element: <Privacy />,
  },
  {
    path: "/legal",
    element: <Legal />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const SentryRouterProvider = withSentryReactRouterV6Routing(RouterProvider);

// Create Sentry-wrapped router
const SentryRoutes = Sentry.withSentryRouting(createRoutesFromChildren);

// Define routes
const router = createBrowserRouter(
  SentryRoutes(
    <Route path="/" element={<Index />} />,
    <Route path="/leaderboard" element={<Leaderboard />} />,
    <Route path="/pricing" element={<Pricing />} />,
    <Route path="/about" element={<About />} />,
    <Route path="/privacy" element={<Privacy />} />,
    <Route path="/legal" element={<Legal />} />,
    <Route path="*" element={<NotFound />} />
  )
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SentryRouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);