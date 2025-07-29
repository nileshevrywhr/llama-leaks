import * as Sentry from "@sentry/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  BrowserRouter, 
  Routes, 
  Route,
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Leaderboard from "./pages/Leaderboard";
import Models from "./pages/Models";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Legal from "./pages/Legal";
import { ThemeProvider } from "./providers/theme-provider";

// Create Sentry-wrapped Router component for automatic route tracking
const SentryBrowserRouter = Sentry.withSentryReactRouterV6Routing(BrowserRouter);

const queryClient = new QueryClient();

// Error fallback component for Sentry Error Boundary
const ErrorFallback = ({ error, resetError }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <div className="text-center space-y-4 max-w-md">
      <h2 className="text-2xl font-bold text-destructive">Something went wrong</h2>
      <p className="text-muted-foreground">
        We've been notified about this error and will fix it soon.
      </p>
      <div className="space-y-2">
        <button 
          onClick={resetError}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Try again
        </button>
        <button 
          onClick={() => window.location.href = '/'}
          className="block mx-auto text-sm text-muted-foreground hover:text-foreground"
        >
          Go to homepage
        </button>
      </div>
    </div>
  </div>
);

const App = () => (
  <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SentryBrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/models" element={<Models />} />
          <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/legal" element={<Legal />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SentryBrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </Sentry.ErrorBoundary>
);

export default App;