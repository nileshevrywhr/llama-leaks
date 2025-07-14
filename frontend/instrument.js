import React from 'react';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import { reactRouterV6BrowserTracingIntegration } from "@sentry/react";

Sentry.init({
  // Your Sentry DSN (Data Source Name) - this tells Sentry where to send error data
  dsn: "https://33881920c473b9003c975ed7a4cdbbe2@o4509549105512448.ingest.de.sentry.io/4509578391191632",
  
  // Custom tunnel endpoint to avoid ad blockers that might block Sentry requests
  tunnel: "/tunnel",

  // Include request headers and IP for users - helps with debugging
  // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Integrations array - these extend Sentry's functionality
  integrations: [
    // Browser tracing integration for performance monitoring
    reactRouterV6BrowserTracingIntegration({
      // Set up automatic route change tracking for React Router
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    // Replay integration to record user sessions when errors occur
    Sentry.replayIntegration({
      // Only record replays when there's an error (saves bandwidth)
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Performance monitoring sample rate (0.0 to 1.0)
  // 1.0 = capture 100% of transactions, 0.1 = capture 10%
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay sample rate
  // Only capture replays for 10% of sessions, but 100% of error sessions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Environment configuration
  environment: process.env.NODE_ENV || 'development',

  // Release tracking - helps identify which version introduced bugs
  release: process.env.REACT_APP_VERSION || '1.0.0',

  // Configure which URLs to trace for performance monitoring
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/yourapi\.domain\.com\/api/,
    /^\//,
  ],

  // Error filtering - ignore common non-critical errors
  beforeSend(event, hint) {
    // Filter out network errors that aren't actionable
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message && error.message.includes('Network Error')) {
        return null; // Don't send this error to Sentry
      }
    }
    return event;
  },

  // Additional configuration for development
  debug: process.env.NODE_ENV === 'development',
});