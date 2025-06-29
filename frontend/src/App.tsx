import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
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
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Legal from "./pages/Legal";

// Enhanced QueryClient with Sentry integration
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Capture React Query errors in Sentry
      Sentry.captureException(error, {
        tags: {
          source: 'react-query',
          queryKey: JSON.stringify(query.queryKey),
        },
        extra: {
          queryKey: query.queryKey,
          state: query.state,
        },
      });
    },
    onSuccess: (data, query) => {
      // Add breadcrumb for successful queries
      Sentry.addBreadcrumb({
        message: 'React Query successful',
        category: 'query',
        level: 'info',
        data: {
          queryKey: JSON.stringify(query.queryKey),
          dataType: typeof data,
        },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      // Capture mutation errors in Sentry
      Sentry.captureException(error, {
        tags: {
          source: 'react-query-mutation',
        },
        extra: {
          variables,
          context,
          mutationKey: mutation.options.mutationKey,
        },
      });
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Log retry attempts to Sentry
        Sentry.addBreadcrumb({
          message: `Query retry attempt ${failureCount}`,
          category: 'query-retry',
          level: 'warning',
          data: {
            failureCount,
            error: error.message,
          },
        });
        return failureCount < 3;
      },
    },
  },
});

// Create Sentry-wrapped router
const SentryRoutes = Sentry.withSentryRouting(createRoutesFromChildren);

// Define routes
const router = createBrowserRouter(
  SentryRoutes(
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
);
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Sentry.ErrorBoundary fallback={<p>An error has occured</p>}>
        <RouterProvider router={router} />
      </Sentry.ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
