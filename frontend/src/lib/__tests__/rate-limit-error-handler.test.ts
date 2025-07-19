/**
 * Tests for rate limit error handler utility
 * Tests error handling and user experience with rate limits
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    handleRateLimitError,
    formatRateLimitMessage,
    calculateRetryDelay,
    isRateLimitError,
    createRateLimitErrorHandler,
    RateLimitErrorInfo
} from '../rate-limit-error-handler';

// Mock console methods
const consoleSpy = {
    warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
    error: vi.spyOn(console, 'error').mockImplementation(() => { })
};

describe('Rate Limit Error Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.values(consoleSpy).forEach(spy => spy.mockClear());
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-03-15T14:30:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const mockRateLimitResponse = {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Daily rate limit exceeded. You have made 3 requests today. Limit resets at 12:00 AM UTC.',
        rateLimit: {
            dailyRemaining: 0,
            monthlyRemaining: 10,
            dailyResetTime: '2024-03-16T00:00:00.000Z',
            monthlyResetTime: '2024-04-01T00:00:00.000Z'
        },
        retryAfter: 3600
    };

    const mockMonthlyRateLimitResponse = {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Monthly rate limit exceeded. You have made 15 requests this month. Limit resets on the 1st day of next month at 12:00 AM UTC.',
        rateLimit: {
            dailyRemaining: 2,
            monthlyRemaining: 0,
            dailyResetTime: '2024-03-16T00:00:00.000Z',
            monthlyResetTime: '2024-04-01T00:00:00.000Z'
        },
        retryAfter: 86400
    };

    describe('isRateLimitError', () => {
        it('should identify rate limit errors correctly', () => {
            const rateLimitError = new Error('Rate limit exceeded');
            rateLimitError.name = 'RateLimitError';
            (rateLimitError as any).status = 429;

            expect(isRateLimitError(rateLimitError)).toBe(true);
        });

        it('should identify 429 status responses as rate limit errors', () => {
            const response = { status: 429, statusText: 'Too Many Requests' };
            expect(isRateLimitError(response)).toBe(true);
        });

        it('should identify rate limit error messages', () => {
            const error = new Error('RATE_LIMIT_EXCEEDED: Daily limit reached');
            expect(isRateLimitError(error)).toBe(true);
        });

        it('should not identify regular errors as rate limit errors', () => {
            const regularError = new Error('Network error');
            expect(isRateLimitError(regularError)).toBe(false);

            const serverError = { status: 500, statusText: 'Internal Server Error' };
            expect(isRateLimitError(serverError)).toBe(false);
        });

        it('should handle null and undefined inputs', () => {
            expect(isRateLimitError(null)).toBe(false);
            expect(isRateLimitError(undefined)).toBe(false);
        });
    });

    describe('formatRateLimitMessage', () => {
        it('should format daily rate limit messages', () => {
            const errorInfo: RateLimitErrorInfo = {
                type: 'daily',
                remaining: 0,
                resetTime: new Date('2024-03-16T00:00:00.000Z'),
                retryAfter: 3600,
                message: 'Daily rate limit exceeded'
            };

            const formatted = formatRateLimitMessage(errorInfo);

            expect(formatted).toContain('daily');
            expect(formatted).toContain('12:00 AM UTC');
            expect(formatted).toContain('tomorrow');
        });

        it('should format monthly rate limit messages', () => {
            const errorInfo: RateLimitErrorInfo = {
                type: 'monthly',
                remaining: 0,
                resetTime: new Date('2024-04-01T00:00:00.000Z'),
                retryAfter: 86400,
                message: 'Monthly rate limit exceeded'
            };

            const formatted = formatRateLimitMessage(errorInfo);

            expect(formatted).toContain('monthly');
            expect(formatted).toContain('April 1st');
            expect(formatted).toContain('12:00 AM UTC');
        });

        it('should include retry time information', () => {
            const errorInfo: RateLimitErrorInfo = {
                type: 'daily',
                remaining: 0,
                resetTime: new Date('2024-03-16T00:00:00.000Z'),
                retryAfter: 3600,
                message: 'Daily rate limit exceeded'
            };

            const formatted = formatRateLimitMessage(errorInfo);

            expect(formatted).toContain('1 hour');
        });

        it('should handle different time formats', () => {
            const testCases = [
                { retryAfter: 60, expected: '1 minute' },
                { retryAfter: 3600, expected: '1 hour' },
                { retryAfter: 7200, expected: '2 hours' },
                { retryAfter: 86400, expected: '1 day' },
                { retryAfter: 90, expected: '1 minute' }, // Should round
                { retryAfter: 3660, expected: '1 hour' } // Should round
            ];

            testCases.forEach(({ retryAfter, expected }) => {
                const errorInfo: RateLimitErrorInfo = {
                    type: 'daily',
                    remaining: 0,
                    resetTime: new Date('2024-03-16T00:00:00.000Z'),
                    retryAfter,
                    message: 'Rate limit exceeded'
                };

                const formatted = formatRateLimitMessage(errorInfo);
                expect(formatted).toContain(expected);
            });
        });

        it('should provide user-friendly language', () => {
            const errorInfo: RateLimitErrorInfo = {
                type: 'daily',
                remaining: 0,
                resetTime: new Date('2024-03-16T00:00:00.000Z'),
                retryAfter: 3600,
                message: 'Daily rate limit exceeded'
            };

            const formatted = formatRateLimitMessage(errorInfo);

            expect(formatted).not.toContain('RATE_LIMIT_EXCEEDED');
            expect(formatted).not.toContain('429');
            expect(formatted).toMatch(/please.*try.*again/i);
        });
    });

    describe('calculateRetryDelay', () => {
        it('should calculate exponential backoff delays', () => {
            const delays = [
                calculateRetryDelay(0),
                calculateRetryDelay(1),
                calculateRetryDelay(2),
                calculateRetryDelay(3)
            ];

            // Each delay should be larger than the previous
            expect(delays[1]).toBeGreaterThan(delays[0]);
            expect(delays[2]).toBeGreaterThan(delays[1]);
            expect(delays[3]).toBeGreaterThan(delays[2]);
        });

        it('should respect maximum delay limits', () => {
            const maxDelay = calculateRetryDelay(10); // High attempt number
            expect(maxDelay).toBeLessThanOrEqual(300000); // 5 minutes max
        });

        it('should add jitter to prevent thundering herd', () => {
            const delays = Array.from({ length: 10 }, () => calculateRetryDelay(1));
            const uniqueDelays = new Set(delays);

            // Should have some variation due to jitter
            expect(uniqueDelays.size).toBeGreaterThan(1);
        });

        it('should handle edge cases', () => {
            expect(calculateRetryDelay(-1)).toBeGreaterThan(0);
            expect(calculateRetryDelay(0)).toBeGreaterThan(0);
            expect(calculateRetryDelay(100)).toBeGreaterThan(0);
        });
    });

    describe('handleRateLimitError', () => {
        it('should extract error information from API response', async () => {
            const mockResponse = {
                status: 429,
                json: async () => mockRateLimitResponse
            };

            const result = await handleRateLimitError(mockResponse);

            expect(result).toMatchObject({
                type: 'daily',
                remaining: 0,
                retryAfter: 3600,
                message: expect.stringContaining('Daily rate limit exceeded')
            });
        });

        it('should handle monthly rate limit errors', async () => {
            const mockResponse = {
                status: 429,
                json: async () => mockMonthlyRateLimitResponse
            };

            const result = await handleRateLimitError(mockResponse);

            expect(result).toMatchObject({
                type: 'monthly',
                remaining: 0,
                retryAfter: 86400
            });
        });

        it('should handle malformed rate limit responses', async () => {
            const mockResponse = {
                status: 429,
                json: async () => ({ invalid: 'response' })
            };

            const result = await handleRateLimitError(mockResponse);

            expect(result).toMatchObject({
                type: 'unknown',
                remaining: 0,
                retryAfter: 3600, // Default retry time
                message: expect.stringContaining('rate limit')
            });
        });

        it('should handle JSON parsing errors', async () => {
            const mockResponse = {
                status: 429,
                json: async () => {
                    throw new Error('Invalid JSON');
                }
            };

            const result = await handleRateLimitError(mockResponse);

            expect(result).toMatchObject({
                type: 'unknown',
                remaining: 0,
                message: expect.stringContaining('rate limit')
            });
        });

        it('should extract retry-after header when available', async () => {
            const mockResponse = {
                status: 429,
                headers: new Headers({ 'Retry-After': '7200' }),
                json: async () => ({ success: false })
            };

            const result = await handleRateLimitError(mockResponse);

            expect(result.retryAfter).toBe(7200);
        });

        it('should handle non-response error objects', async () => {
            const error = new Error('Rate limit exceeded');
            error.name = 'RateLimitError';

            const result = await handleRateLimitError(error);

            expect(result).toMatchObject({
                type: 'unknown',
                remaining: 0,
                message: expect.stringContaining('rate limit')
            });
        });
    });

    describe('createRateLimitErrorHandler', () => {
        it('should create a reusable error handler', () => {
            const onError = vi.fn();
            const onRetry = vi.fn();

            const handler = createRateLimitErrorHandler({
                onError,
                onRetry,
                maxRetries: 3
            });

            expect(typeof handler).toBe('function');
        });

        it('should call onError callback with formatted message', async () => {
            const onError = vi.fn();
            const handler = createRateLimitErrorHandler({ onError });

            const mockResponse = {
                status: 429,
                json: async () => mockRateLimitResponse
            };

            await handler(mockResponse);

            expect(onError).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'daily',
                    remaining: 0,
                    formattedMessage: expect.stringContaining('daily')
                })
            );
        });

        it('should implement automatic retry logic', async () => {
            const onRetry = vi.fn();
            const retryFunction = vi.fn().mockResolvedValue({ success: true });

            const handler = createRateLimitErrorHandler({
                onRetry,
                maxRetries: 2,
                retryFunction
            });

            const mockResponse = {
                status: 429,
                json: async () => mockRateLimitResponse
            };

            await handler(mockResponse);

            // Should schedule retry
            expect(onRetry).toHaveBeenCalledWith(
                expect.objectContaining({
                    attempt: 1,
                    delay: expect.any(Number)
                })
            );
        });

        it('should respect maxRetries limit', async () => {
            const onRetry = vi.fn();
            const retryFunction = vi.fn().mockRejectedValue(new Error('Still rate limited'));

            const handler = createRateLimitErrorHandler({
                onRetry,
                maxRetries: 2,
                retryFunction
            });

            const mockResponse = {
                status: 429,
                json: async () => mockRateLimitResponse
            };

            await handler(mockResponse);

            // Should not exceed maxRetries
            expect(onRetry).toHaveBeenCalledTimes(2);
        });

        it('should handle successful retries', async () => {
            const onSuccess = vi.fn();
            const retryFunction = vi.fn().mockResolvedValue({ success: true, data: 'test' });

            const handler = createRateLimitErrorHandler({
                onSuccess,
                retryFunction
            });

            const mockResponse = {
                status: 429,
                json: async () => mockRateLimitResponse
            };

            await handler(mockResponse);

            // Fast-forward timers to trigger retry
            vi.advanceTimersByTime(5000);

            await vi.runAllTimersAsync();

            expect(onSuccess).toHaveBeenCalledWith({ success: true, data: 'test' });
        });

        it('should provide progress updates during retry', async () => {
            const onProgress = vi.fn();
            const retryFunction = vi.fn().mockResolvedValue({ success: true });

            const handler = createRateLimitErrorHandler({
                onProgress,
                retryFunction
            });

            const mockResponse = {
                status: 429,
                json: async () => mockRateLimitResponse
            };

            await handler(mockResponse);

            expect(onProgress).toHaveBeenCalledWith(
                expect.objectContaining({
                    timeRemaining: expect.any(Number),
                    totalWaitTime: expect.any(Number)
                })
            );
        });
    });

    describe('User experience helpers', () => {
        it('should provide countdown timer functionality', () => {
            const errorInfo: RateLimitErrorInfo = {
                type: 'daily',
                remaining: 0,
                resetTime: new Date('2024-03-16T00:00:00.000Z'),
                retryAfter: 3600,
                message: 'Daily rate limit exceeded'
            };

            const countdown = createCountdownTimer(errorInfo.retryAfter);

            expect(countdown.timeRemaining).toBe(3600);
            expect(countdown.formattedTime).toContain('1:00:00');

            // Advance time
            vi.advanceTimersByTime(1000);
            countdown.update();

            expect(countdown.timeRemaining).toBe(3599);
            expect(countdown.formattedTime).toContain('59:59');
        });

        it('should provide user-friendly error messages', () => {
            const testCases = [
                {
                    type: 'daily' as const,
                    expected: /daily.*limit.*exceeded/i
                },
                {
                    type: 'monthly' as const,
                    expected: /monthly.*limit.*exceeded/i
                },
                {
                    type: 'unknown' as const,
                    expected: /rate.*limit.*exceeded/i
                }
            ];

            testCases.forEach(({ type, expected }) => {
                const errorInfo: RateLimitErrorInfo = {
                    type,
                    remaining: 0,
                    resetTime: new Date('2024-03-16T00:00:00.000Z'),
                    retryAfter: 3600,
                    message: 'Rate limit exceeded'
                };

                const message = formatRateLimitMessage(errorInfo);
                expect(message).toMatch(expected);
            });
        });

        it('should suggest alternative actions', () => {
            const errorInfo: RateLimitErrorInfo = {
                type: 'daily',
                remaining: 0,
                resetTime: new Date('2024-03-16T00:00:00.000Z'),
                retryAfter: 3600,
                message: 'Daily rate limit exceeded'
            };

            const suggestions = getSuggestions(errorInfo);

            expect(suggestions).toContain('Try again tomorrow');
            expect(suggestions).toContain('bookmark');
            expect(suggestions).toContain('share');
        });
    });

    describe('Integration with monitoring', () => {
        it('should log rate limit violations for monitoring', async () => {
            const mockResponse = {
                status: 429,
                json: async () => mockRateLimitResponse
            };

            await handleRateLimitError(mockResponse);

            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('Rate limit exceeded'),
                expect.objectContaining({
                    type: 'daily',
                    retryAfter: 3600
                })
            );
        });

        it('should track retry attempts', async () => {
            const onRetry = vi.fn();
            const retryFunction = vi.fn().mockRejectedValue(new Error('Still rate limited'));

            const handler = createRateLimitErrorHandler({
                onRetry,
                maxRetries: 3,
                retryFunction
            });

            const mockResponse = {
                status: 429,
                json: async () => mockRateLimitResponse
            };

            await handler(mockResponse);

            // Should track each retry attempt
            expect(onRetry).toHaveBeenCalledWith(
                expect.objectContaining({
                    attempt: expect.any(Number),
                    totalAttempts: 3
                })
            );
        });
    });
});

// Helper functions that would be part of the rate-limit-error-handler module
function createCountdownTimer(initialSeconds: number) {
    let timeRemaining = initialSeconds;

    return {
        get timeRemaining() { return timeRemaining; },
        get formattedTime() {
            const hours = Math.floor(timeRemaining / 3600);
            const minutes = Math.floor((timeRemaining % 3600) / 60);
            const seconds = timeRemaining % 60;
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        },
        update() {
            timeRemaining = Math.max(0, timeRemaining - 1);
        }
    };
}

function getSuggestions(errorInfo: RateLimitErrorInfo): string[] {
    const suggestions = [
        'Try again after the limit resets',
        'Bookmark this page to return later',
        'Share this page with others'
    ];

    if (errorInfo.type === 'daily') {
        suggestions.unshift('Try again tomorrow');
    } else if (errorInfo.type === 'monthly') {
        suggestions.unshift('Try again next month');
    }

    return suggestions;
}