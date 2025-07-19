/**
 * Rate limiting utilities for managing user request counters
 * Handles daily and monthly rate limit counters in Vercel KV storage
 */

import { kvClient, validateKVEnvironment, safeKVOperation, classifyKVError, KVErrorType } from './kv';
import { getCurrentUTCDateString, getCurrentUTCMonthString, getSecondsUntilDailyReset, getSecondsUntilMonthlyReset } from './time-utils';
import {
    logRateLimitViolation,
    logRateLimitWarning,
    logKVError,
    logPerformanceMetric,
    createTimer
} from './monitoring';

// Rate limit constants
export const DAILY_LIMIT = 3;
export const MONTHLY_LIMIT = 15;

// Rate limit data structure
export interface RateLimitData {
    count: number;
    firstRequest: string; // ISO timestamp
    lastRequest: string;  // ISO timestamp
}

// Rate limit state for responses
export interface RateLimitState {
    dailyCount: number;
    monthlyCount: number;
    dailyRemaining: number;
    monthlyRemaining: number;
    dailyResetTime: Date;
    monthlyResetTime: Date;
    isBlocked: boolean;
    blockType: 'daily' | 'monthly' | null;
}

/**
 * Generate KV storage key for daily rate limit counter
 * @param userHash User identifier hash
 * @returns KV key for daily counter
 */
export function getDailyCounterKey(userHash: string): string {
    const dateString = getCurrentUTCDateString();
    return `daily:${userHash}:${dateString}`;
}

/**
 * Generate KV storage key for monthly rate limit counter
 * @param userHash User identifier hash
 * @returns KV key for monthly counter
 */
export function getMonthlyCounterKey(userHash: string): string {
    const monthString = getCurrentUTCMonthString();
    return `monthly:${userHash}:${monthString}`;
}

/**
 * Get current rate limit data for a user
 * @param userHash User identifier hash
 * @returns Promise resolving to current rate limit state
 */
export async function getRateLimitData(userHash: string): Promise<RateLimitState> {
    const fallbackState: RateLimitState = {
        dailyCount: 0,
        monthlyCount: 0,
        dailyRemaining: DAILY_LIMIT,
        monthlyRemaining: MONTHLY_LIMIT,
        dailyResetTime: new Date(Date.now() + getSecondsUntilDailyReset() * 1000),
        monthlyResetTime: new Date(Date.now() + getSecondsUntilMonthlyReset() * 1000),
        isBlocked: false,
        blockType: null
    };

    if (!validateKVEnvironment()) {
        console.log('[RateLimit] KV environment not available, using fallback state', {
            userHash: userHash.substring(0, 8) + '...',
            timestamp: new Date().toISOString()
        });
        return fallbackState;
    }

    const dailyKey = getDailyCounterKey(userHash);
    const monthlyKey = getMonthlyCounterKey(userHash);

    // Get both counters using safe KV operations
    const [dailyData, monthlyData] = await Promise.all([
        safeKVOperation(
            () => kvClient.get<RateLimitData>(dailyKey),
            `get-daily-counter-${userHash.substring(0, 8)}`
        ),
        safeKVOperation(
            () => kvClient.get<RateLimitData>(monthlyKey),
            `get-monthly-counter-${userHash.substring(0, 8)}`
        )
    ]);

    // If either operation failed, return fallback state
    if (dailyData === null || monthlyData === null) {
        console.warn('[RateLimit] Failed to retrieve rate limit data, using fallback state', {
            userHash: userHash.substring(0, 8) + '...',
            dailyDataAvailable: dailyData !== null,
            monthlyDataAvailable: monthlyData !== null,
            timestamp: new Date().toISOString()
        });
        return fallbackState;
    }

    const dailyCount = dailyData?.count || 0;
    const monthlyCount = monthlyData?.count || 0;

    const dailyRemaining = Math.max(0, DAILY_LIMIT - dailyCount);
    const monthlyRemaining = Math.max(0, MONTHLY_LIMIT - monthlyCount);

    const isBlocked = dailyCount >= DAILY_LIMIT || monthlyCount >= MONTHLY_LIMIT;
    const blockType = dailyCount >= DAILY_LIMIT ? 'daily' :
        monthlyCount >= MONTHLY_LIMIT ? 'monthly' : null;

    console.log('[RateLimit] Retrieved rate limit data', {
        userHash: userHash.substring(0, 8) + '...',
        dailyCount,
        monthlyCount,
        dailyRemaining,
        monthlyRemaining,
        isBlocked,
        blockType,
        timestamp: new Date().toISOString()
    });

    return {
        dailyCount,
        monthlyCount,
        dailyRemaining,
        monthlyRemaining,
        dailyResetTime: new Date(Date.now() + getSecondsUntilDailyReset() * 1000),
        monthlyResetTime: new Date(Date.now() + getSecondsUntilMonthlyReset() * 1000),
        isBlocked,
        blockType
    };
}

/**
 * Increment rate limit counters for a user (atomic operation)
 * @param userHash User identifier hash
 * @returns Promise resolving to updated rate limit state
 */
export async function incrementRateLimitCounters(userHash: string): Promise<RateLimitState> {
    if (!validateKVEnvironment()) {
        console.log('[RateLimit] KV environment not available, returning current state without increment', {
            userHash: userHash.substring(0, 8) + '...',
            timestamp: new Date().toISOString()
        });
        return getRateLimitData(userHash);
    }

    const now = new Date().toISOString();
    const dailyKey = getDailyCounterKey(userHash);
    const monthlyKey = getMonthlyCounterKey(userHash);

    // Calculate TTL for automatic cleanup
    const dailyTTL = getSecondsUntilDailyReset() + 3600; // Add 1 hour buffer
    const monthlyTTL = getSecondsUntilMonthlyReset() + 3600; // Add 1 hour buffer

    // Get current values first using safe operations
    const [dailyData, monthlyData] = await Promise.all([
        safeKVOperation(
            () => kvClient.get<RateLimitData>(dailyKey),
            `get-daily-for-increment-${userHash.substring(0, 8)}`
        ),
        safeKVOperation(
            () => kvClient.get<RateLimitData>(monthlyKey),
            `get-monthly-for-increment-${userHash.substring(0, 8)}`
        )
    ]);

    // If we can't get current values, return current state without incrementing
    if (dailyData === null || monthlyData === null) {
        console.error('[RateLimit] Failed to get current counter values, not incrementing', {
            userHash: userHash.substring(0, 8) + '...',
            dailyDataAvailable: dailyData !== null,
            monthlyDataAvailable: monthlyData !== null,
            timestamp: new Date().toISOString()
        });
        return getRateLimitData(userHash);
    }

    // Prepare new counter data
    const newDailyData: RateLimitData = {
        count: (dailyData?.count || 0) + 1,
        firstRequest: dailyData?.firstRequest || now,
        lastRequest: now
    };

    const newMonthlyData: RateLimitData = {
        count: (monthlyData?.count || 0) + 1,
        firstRequest: monthlyData?.firstRequest || now,
        lastRequest: now
    };

    // Atomic update using pipeline with safe operation wrapper
    const pipelineResult = await safeKVOperation(
        async () => {
            const pipeline = kvClient.pipeline();
            pipeline.set(dailyKey, newDailyData, { ex: dailyTTL });
            pipeline.set(monthlyKey, newMonthlyData, { ex: monthlyTTL });
            return await pipeline.exec();
        },
        `increment-counters-${userHash.substring(0, 8)}`,
        1 // Only retry once for atomic operations
    );

    // If pipeline failed, return current state without incrementing
    if (pipelineResult === null) {
        console.error('[RateLimit] Failed to increment counters atomically, returning current state', {
            userHash: userHash.substring(0, 8) + '...',
            timestamp: new Date().toISOString()
        });
        return getRateLimitData(userHash);
    }

    // Return updated state
    const dailyRemaining = Math.max(0, DAILY_LIMIT - newDailyData.count);
    const monthlyRemaining = Math.max(0, MONTHLY_LIMIT - newMonthlyData.count);

    const isBlocked = newDailyData.count >= DAILY_LIMIT || newMonthlyData.count >= MONTHLY_LIMIT;
    const blockType = newDailyData.count >= DAILY_LIMIT ? 'daily' :
        newMonthlyData.count >= MONTHLY_LIMIT ? 'monthly' : null;

    console.log('[RateLimit] Successfully incremented counters', {
        userHash: userHash.substring(0, 8) + '...',
        newDailyCount: newDailyData.count,
        newMonthlyCount: newMonthlyData.count,
        dailyRemaining,
        monthlyRemaining,
        isBlocked,
        blockType,
        timestamp: new Date().toISOString()
    });

    return {
        dailyCount: newDailyData.count,
        monthlyCount: newMonthlyData.count,
        dailyRemaining,
        monthlyRemaining,
        dailyResetTime: new Date(Date.now() + getSecondsUntilDailyReset() * 1000),
        monthlyResetTime: new Date(Date.now() + getSecondsUntilMonthlyReset() * 1000),
        isBlocked,
        blockType
    };
}

/**
 * Check if a user has exceeded rate limits without incrementing counters
 * @param userHash User identifier hash
 * @returns Promise resolving to rate limit state
 */
export async function checkRateLimit(userHash: string): Promise<RateLimitState> {
    return getRateLimitData(userHash);
}

/**
 * Reset rate limit counters for a user (for testing purposes)
 * @param userHash User identifier hash
 * @returns Promise resolving to success status
 */
export async function resetRateLimitCounters(userHash: string): Promise<boolean> {
    if (!validateKVEnvironment()) {
        console.log('[RateLimit] KV environment not available, reset operation skipped', {
            userHash: userHash.substring(0, 8) + '...',
            timestamp: new Date().toISOString()
        });
        return true; // Always succeed when KV is not available
    }

    const dailyKey = getDailyCounterKey(userHash);
    const monthlyKey = getMonthlyCounterKey(userHash);

    // Use safe operations for deletion
    const [dailyDeleted, monthlyDeleted] = await Promise.all([
        safeKVOperation(
            () => kvClient.del(dailyKey),
            `reset-daily-counter-${userHash.substring(0, 8)}`
        ),
        safeKVOperation(
            () => kvClient.del(monthlyKey),
            `reset-monthly-counter-${userHash.substring(0, 8)}`
        )
    ]);

    const success = dailyDeleted !== null && monthlyDeleted !== null;

    if (success) {
        console.log('[RateLimit] Successfully reset rate limit counters', {
            userHash: userHash.substring(0, 8) + '...',
            timestamp: new Date().toISOString()
        });
    } else {
        console.error('[RateLimit] Failed to reset rate limit counters', {
            userHash: userHash.substring(0, 8) + '...',
            dailyDeleted: dailyDeleted !== null,
            monthlyDeleted: monthlyDeleted !== null,
            timestamp: new Date().toISOString()
        });
    }

    return success;
}

/**
 * Get rate limit information for response headers
 * @param rateLimitState Current rate limit state
 * @returns Object with header values
 */
export function getRateLimitHeaders(rateLimitState: RateLimitState): Record<string, string> {
    return {
        'X-RateLimit-Limit-Daily': DAILY_LIMIT.toString(),
        'X-RateLimit-Limit-Monthly': MONTHLY_LIMIT.toString(),
        'X-RateLimit-Remaining-Daily': rateLimitState.dailyRemaining.toString(),
        'X-RateLimit-Remaining-Monthly': rateLimitState.monthlyRemaining.toString(),
        'X-RateLimit-Reset-Daily': rateLimitState.dailyResetTime.toISOString(),
        'X-RateLimit-Reset-Monthly': rateLimitState.monthlyResetTime.toISOString(),
        ...(rateLimitState.isBlocked && {
            'Retry-After': rateLimitState.blockType === 'daily'
                ? getSecondsUntilDailyReset().toString()
                : getSecondsUntilMonthlyReset().toString()
        })
    };
}
// Rate limit checking result
export interface RateLimitCheckResult {
    allowed: boolean;
    rateLimitState: RateLimitState;
    errorMessage?: string;
    retryAfter?: number;
}

/**
 * Check if a request should be allowed based on rate limits
 * This is the main function to use before processing requests
 * @param userHash User identifier hash
 * @returns Promise resolving to rate limit check result
 */
export async function checkRequestRateLimit(userHash: string): Promise<RateLimitCheckResult> {
    const fallbackState: RateLimitState = {
        dailyCount: 0,
        monthlyCount: 0,
        dailyRemaining: DAILY_LIMIT,
        monthlyRemaining: MONTHLY_LIMIT,
        dailyResetTime: new Date(Date.now() + getSecondsUntilDailyReset() * 1000),
        monthlyResetTime: new Date(Date.now() + getSecondsUntilMonthlyReset() * 1000),
        isBlocked: false,
        blockType: null
    };

    try {
        const rateLimitState = await getRateLimitData(userHash);

        console.log('[RateLimit] Checking request rate limit', {
            userHash: userHash.substring(0, 8) + '...',
            dailyCount: rateLimitState.dailyCount,
            monthlyCount: rateLimitState.monthlyCount,
            isBlocked: rateLimitState.isBlocked,
            blockType: rateLimitState.blockType,
            timestamp: new Date().toISOString()
        });

        if (rateLimitState.isBlocked) {
            const retryAfter = rateLimitState.blockType === 'daily'
                ? getSecondsUntilDailyReset()
                : getSecondsUntilMonthlyReset();

            const errorMessage = rateLimitState.blockType === 'daily'
                ? `Daily rate limit exceeded. You have made ${rateLimitState.dailyCount} requests today. Limit resets at 12:00 AM UTC.`
                : `Monthly rate limit exceeded. You have made ${rateLimitState.monthlyCount} requests this month. Limit resets on the 1st day of next month at 12:00 AM UTC.`;

            // Log rate limit violation for monitoring
            logRateLimitViolation(
                userHash,
                'unknown', // IP will be provided by caller if available
                rateLimitState.blockType!,
                rateLimitState.blockType === 'daily' ? rateLimitState.dailyCount : rateLimitState.monthlyCount
            );

            console.warn('[RateLimit] Request blocked by rate limit', {
                userHash: userHash.substring(0, 8) + '...',
                blockType: rateLimitState.blockType,
                dailyCount: rateLimitState.dailyCount,
                monthlyCount: rateLimitState.monthlyCount,
                retryAfter,
                timestamp: new Date().toISOString()
            });

            return {
                allowed: false,
                rateLimitState,
                errorMessage,
                retryAfter
            };
        }

        return {
            allowed: true,
            rateLimitState
        };
    } catch (error) {
        const kvError = classifyKVError(error);
        console.error('[RateLimit] Error checking rate limit, using fallback (permissive)', {
            userHash: userHash.substring(0, 8) + '...',
            error: kvError.message,
            errorType: kvError.type,
            retryable: kvError.retryable,
            timestamp: new Date().toISOString()
        });

        // Return permissive result on error to avoid blocking legitimate users
        return {
            allowed: true,
            rateLimitState: fallbackState
        };
    }
}

/**
 * Process a request with rate limiting (check + increment)
 * This is the main function to use when processing actual requests
 * @param userHash User identifier hash
 * @returns Promise resolving to rate limit check result with updated counters
 */
export async function processRequestWithRateLimit(userHash: string): Promise<RateLimitCheckResult> {
    const fallbackState: RateLimitState = {
        dailyCount: 0,
        monthlyCount: 0,
        dailyRemaining: DAILY_LIMIT,
        monthlyRemaining: MONTHLY_LIMIT,
        dailyResetTime: new Date(Date.now() + getSecondsUntilDailyReset() * 1000),
        monthlyResetTime: new Date(Date.now() + getSecondsUntilMonthlyReset() * 1000),
        isBlocked: false,
        blockType: null
    };

    try {
        console.log('[RateLimit] Processing request with rate limiting', {
            userHash: userHash.substring(0, 8) + '...',
            timestamp: new Date().toISOString()
        });

        // First check if the request should be allowed
        const checkResult = await checkRequestRateLimit(userHash);

        if (!checkResult.allowed) {
            console.log('[RateLimit] Request denied by rate limit check', {
                userHash: userHash.substring(0, 8) + '...',
                blockType: checkResult.rateLimitState.blockType,
                timestamp: new Date().toISOString()
            });
            return checkResult;
        }

        // If allowed, increment the counters
        const updatedState = await incrementRateLimitCounters(userHash);

        console.log('[RateLimit] Request processed successfully', {
            userHash: userHash.substring(0, 8) + '...',
            newDailyCount: updatedState.dailyCount,
            newMonthlyCount: updatedState.monthlyCount,
            dailyRemaining: updatedState.dailyRemaining,
            monthlyRemaining: updatedState.monthlyRemaining,
            timestamp: new Date().toISOString()
        });

        return {
            allowed: true,
            rateLimitState: updatedState
        };
    } catch (error) {
        const kvError = classifyKVError(error);
        console.error('[RateLimit] Error processing request with rate limit, using fallback (permissive)', {
            userHash: userHash.substring(0, 8) + '...',
            error: kvError.message,
            errorType: kvError.type,
            retryable: kvError.retryable,
            timestamp: new Date().toISOString()
        });

        // Return permissive result on error to avoid blocking legitimate users
        return {
            allowed: true,
            rateLimitState: fallbackState
        };
    }
}

/**
 * Get remaining requests and reset times for a user
 * Useful for displaying quota information to users
 * @param userHash User identifier hash
 * @returns Promise resolving to quota information
 */
export async function getUserQuotaInfo(userHash: string): Promise<{
    dailyRemaining: number;
    monthlyRemaining: number;
    dailyResetTime: Date;
    monthlyResetTime: Date;
    isBlocked: boolean;
    blockType: 'daily' | 'monthly' | null;
}> {
    const rateLimitState = await getRateLimitData(userHash);

    return {
        dailyRemaining: rateLimitState.dailyRemaining,
        monthlyRemaining: rateLimitState.monthlyRemaining,
        dailyResetTime: rateLimitState.dailyResetTime,
        monthlyResetTime: rateLimitState.monthlyResetTime,
        isBlocked: rateLimitState.isBlocked,
        blockType: rateLimitState.blockType
    };
}

/**
 * Check if a user is approaching rate limits (warning thresholds)
 * @param userHash User identifier hash
 * @returns Promise resolving to warning information
 */
export async function checkRateLimitWarnings(userHash: string): Promise<{
    dailyWarning: boolean;
    monthlyWarning: boolean;
    dailyRemaining: number;
    monthlyRemaining: number;
}> {
    const rateLimitState = await getRateLimitData(userHash);

    // Warning thresholds: 1 remaining for daily, 3 remaining for monthly
    const dailyWarning = rateLimitState.dailyRemaining <= 1 && rateLimitState.dailyRemaining > 0;
    const monthlyWarning = rateLimitState.monthlyRemaining <= 3 && rateLimitState.monthlyRemaining > 0;

    // Log warnings for monitoring
    if (dailyWarning) {
        logRateLimitWarning(
            userHash,
            'unknown', // IP will be provided by caller if available
            'daily',
            rateLimitState.dailyCount,
            rateLimitState.dailyRemaining
        );
    }

    if (monthlyWarning) {
        logRateLimitWarning(
            userHash,
            'unknown', // IP will be provided by caller if available
            'monthly',
            rateLimitState.monthlyCount,
            rateLimitState.monthlyRemaining
        );
    }

    return {
        dailyWarning,
        monthlyWarning,
        dailyRemaining: rateLimitState.dailyRemaining,
        monthlyRemaining: rateLimitState.monthlyRemaining
    };
}