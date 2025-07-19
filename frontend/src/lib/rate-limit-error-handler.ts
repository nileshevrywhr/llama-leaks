/**
 * Utility functions for handling rate limit errors in frontend components
 */

interface RateLimitInfo {
    dailyRemaining: number;
    monthlyRemaining: number;
    dailyResetTime: string;
    monthlyResetTime: string;
}

interface RateLimitErrorResponse {
    success: false;
    error: string;
    message: string;
    rateLimit?: RateLimitInfo;
    retryAfter?: number;
}

/**
 * Check if an error response is a rate limit error
 */
export function isRateLimitError(response: any): response is RateLimitErrorResponse {
    return (
        response &&
        response.success === false &&
        response.error === 'RATE_LIMIT_EXCEEDED'
    );
}

/**
 * Format a user-friendly rate limit error message
 */
export function formatRateLimitErrorMessage(errorResponse: RateLimitErrorResponse): string {
    const { rateLimit, retryAfter } = errorResponse;

    if (!rateLimit) {
        return 'Rate limit exceeded. Please try again later.';
    }

    // Determine which limit was exceeded
    const isDailyLimitExceeded = rateLimit.dailyRemaining === 0;
    const isMonthlyLimitExceeded = rateLimit.monthlyRemaining === 0;

    if (isDailyLimitExceeded && isMonthlyLimitExceeded) {
        return 'You have exceeded both daily and monthly limits. Please try again next month.';
    } else if (isDailyLimitExceeded) {
        const resetTime = formatResetTime(rateLimit.dailyResetTime);
        return `Daily limit exceeded (3 requests per day). Resets ${resetTime}.`;
    } else if (isMonthlyLimitExceeded) {
        const resetTime = formatResetTime(rateLimit.monthlyResetTime);
        return `Monthly limit exceeded (15 requests per month). Resets ${resetTime}.`;
    }

    return 'Rate limit exceeded. Please try again later.';
}

/**
 * Format reset time in a user-friendly way
 */
function formatResetTime(resetTimeString: string): string {
    try {
        const resetTime = new Date(resetTimeString);
        const now = new Date();
        const diffMs = resetTime.getTime() - now.getTime();

        if (diffMs <= 0) {
            return 'shortly';
        }

        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHours > 24) {
            const diffDays = Math.floor(diffHours / 24);
            return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        } else if (diffMinutes > 0) {
            return `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
        } else {
            return 'shortly';
        }
    } catch {
        return 'at the next reset time';
    }
}

/**
 * Get remaining quota information for display
 */
export function getRemainingQuotaInfo(rateLimit: RateLimitInfo): {
    dailyRemaining: number;
    monthlyRemaining: number;
    dailyResetTime: string;
    monthlyResetTime: string;
} {
    return {
        dailyRemaining: rateLimit.dailyRemaining,
        monthlyRemaining: rateLimit.monthlyRemaining,
        dailyResetTime: formatResetTime(rateLimit.dailyResetTime),
        monthlyResetTime: formatResetTime(rateLimit.monthlyResetTime),
    };
}

/**
 * Handle rate limit errors with retry logic
 */
export function handleRateLimitError(
    errorResponse: RateLimitErrorResponse,
    onRetry?: () => void
): {
    message: string;
    canRetry: boolean;
    retryAfter?: number;
} {
    const message = formatRateLimitErrorMessage(errorResponse);
    const canRetry = !!errorResponse.retryAfter && errorResponse.retryAfter > 0;

    return {
        message,
        canRetry,
        retryAfter: errorResponse.retryAfter,
    };
}

/**
 * Create a retry function with automatic delay
 */
export function createRetryFunction(
    retryAfter: number,
    onRetry: () => void
): () => void {
    return () => {
        setTimeout(() => {
            onRetry();
        }, retryAfter * 1000); // Convert seconds to milliseconds
    };
}