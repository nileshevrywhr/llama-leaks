import * as Sentry from "@sentry/react";

/**
 * Manually capture an exception to Sentry
 * Use this for caught errors that you want to track
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setTag(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
};

/**
 * Capture a custom message to Sentry
 * Use this for logging important events or warnings
 */
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

/**
 * Add user context to Sentry
 * Call this when user logs in or when you have user information
 */
export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

/**
 * Add custom tags to all future Sentry events
 * Useful for tracking feature flags, user segments, etc.
 */
export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

/**
 * Start a new transaction for performance monitoring
 * Use this to track custom operations
 */
export const startTransaction = (name: string, operation: string) => {
  return Sentry.startTransaction({ name, op: operation });
};

/**
 * Add breadcrumb for debugging context
 * These help understand what led to an error
 */
export const addBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now() / 1000,
  });
};