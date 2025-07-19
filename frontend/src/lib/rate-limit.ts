/**
 * Rate limiting utilities for managing user request counters
 * Handles daily and monthly rate limit counters in Vercel KV storage
 */

import { kvClient, validateKVEnvironment } from './kv';
import { getCurrentUTCDateString, getCurrentUTCMonthString, getSecondsUntilDailyReset, getSecondsUntilMonthlyReset } from './time-utils';

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
    if (!validateKVEnvironment()) {
        // Return permissive state when KV is not available
        return {
            dailyCount: 0,
            monthlyCount: 0,
            dailyRemaining: DAILY_LIMIT,
            monthlyRemaining: MONTHLY_LIMIT,
            dailyResetTime: new Date(Date.now() + getSecondsUntilDailyReset() * 1000),
            monthlyResetTime: new Date(Date.now() + getSecondsUntilMonthlyReset() * 1000),
            isBlocked: false,
            blockType: null
        };
    }

    try {
        const dailyKey = getDailyCounterKey(userHash);
        const monthlyKey = getMonthlyCounterKey(userHash);

        // Get both counters in parallel
        const [dailyData, monthlyData] = await Promise.all([
            kvClient.get<RateLimitData>(dailyKey),
            kvClient.get<RateLimitData>(monthlyKey)
        ]);

        const dailyCount = dailyData?.count || 0;
        const monthlyCount = monthlyData?.count || 0;

        const dailyRemaining = Math.max(0, DAILY_LIMIT - dailyCount);
        const monthlyRemaining = Math.max(0, MONTHLY_LIMIT - monthlyCount);

        const isBlocked = dailyCount >= DAILY_LIMIT || monthlyCount >= MONTHLY_LIMIT;
        const blockType = dailyCount >= DAILY_LIMIT ? 'daily' :
            monthlyCount >= MONTHLY_LIMIT ? 'monthly' : null;

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
    } catch (error) {
        console.error('Error getting rate limit data:', error);
        // Return permissive state on error
        return {
            dailyCount: 0,
            monthlyCount: 0,
            dailyRemaining: DAILY_LIMIT,
            monthlyRemaining: MONTHLY_LIMIT,
            dailyResetTime: new Date(Date.now() + getSecondsUntilDailyReset() * 1000),
            monthlyResetTime: new Date(Date.now() + getSecondsUntilMonthlyReset() * 1000),
            isBlocked: false,
            blockType: null
        };
    }
}

/**
 * Increment rate limit counters for a user (atomic operation)
 * @param userHash User identifier hash
 * @returns Promise resolving to updated rate limit state
 */
export async function incrementRateLimitCounters(userHash: string): Promise<RateLimitState> {
    if (!validateKVEnvironment()) {
        // Return permissive state when KV is not available
        return getRateLimitData(userHash);
    }

    try {
        const now = new Date().toISOString();
        const dailyKey = getDailyCounterKey(userHash);
        const monthlyKey = getMonthlyCounterKey(userHash);

        // Calculate TTL for automatic cleanup
        const dailyTTL = getSecondsUntilDailyReset() + 3600; // Add 1 hour buffer
        const monthlyTTL = getSecondsUntilMonthlyReset() + 3600; // Add 1 hour buffer

        // Get current values first
        const [dailyData, monthlyData] = await Promise.all([
            kvClient.get<RateLimitData>(dailyKey),
            kvClient.get<RateLimitData>(monthlyKey)
        ]);

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

        // Atomic update using pipeline for consistency
        const pipeline = kvClient.pipeline();
        pipeline.set(dailyKey, newDailyData, { ex: dailyTTL });
        pipeline.set(monthlyKey, newMonthlyData, { ex: monthlyTTL });

        await pipeline.exec();

        // Return updated state
        const dailyRemaining = Math.max(0, DAILY_LIMIT - newDailyData.count);
        const monthlyRemaining = Math.max(0, MONTHLY_LIMIT - newMonthlyData.count);

        const isBlocked = newDailyData.count >= DAILY_LIMIT || newMonthlyData.count >= MONTHLY_LIMIT;
        const blockType = newDailyData.count >= DAILY_LIMIT ? 'daily' :
            newMonthlyData.count >= MONTHLY_LIMIT ? 'monthly' : null;

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
    } catch (error) {
        console.error('Error incrementing rate limit counters:', error);
        // Return current state on error (don't increment)
        return getRateLimitData(userHash);
    }
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
        return true; // Always succeed when KV is not available
    }

    try {
        const dailyKey = getDailyCounterKey(userHash);
        const monthlyKey = getMonthlyCounterKey(userHash);

        await Promise.all([
            kvClient.del(dailyKey),
            kvClient.del(monthlyKey)
        ]);

        return true;
    } catch (error) {
        console.error('Error resetting rate limit counters:', error);
        return false;
    }
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
    try {
        const rateLimitState = await getRateLimitData(userHash);

        if (rateLimitState.isBlocked) {
            const retryAfter = rateLimitState.blockType === 'daily'
                ? getSecondsUntilDailyReset()
                : getSecondsUntilMonthlyReset();

            const errorMessage = rateLimitState.blockType === 'daily'
                ? `Daily rate limit exceeded. You have made ${rateLimitState.dailyCount} requests today. Limit resets at 12:00 AM UTC.`
                : `Monthly rate limit exceeded. You have made ${rateLimitState.monthlyCount} requests this month. Limit resets on the 1st day of next month at 12:00 AM UTC.`;

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
        console.error('Error checking rate limit:', error);

        // Return permissive result on error to avoid blocking legitimate users
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
    try {
        // First check if the request should be allowed
        const checkResult = await checkRequestRateLimit(userHash);

        if (!checkResult.allowed) {
            return checkResult;
        }

        // If allowed, increment the counters
        const updatedState = await incrementRateLimitCounters(userHash);

        return {
            allowed: true,
            rateLimitState: updatedState
        };
    } catch (error) {
        console.error('Error processing request with rate limit:', error);

        // Return permissive result on error
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

    return {
        dailyWarning,
        monthlyWarning,
        dailyRemaining: rateLimitState.dailyRemaining,
        monthlyRemaining: rateLimitState.monthlyRemaining
    };
}