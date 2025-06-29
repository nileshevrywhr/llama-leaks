import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Leaderboard from "./pages/Leaderboard";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Legal from "./pages/Legal";

const queryClient = new QueryClient();

// Create the router with Sentry integration
const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(createBrowserRouter);

// Define routes as objects for Sentry integration
const router = sentryCreateBrowserRouter([
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
        <RouterProvider router={router} />
      </Sentry.ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;