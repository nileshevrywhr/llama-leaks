/**
 * UTC time calculation utilities for rate limiting
 * Provides functions to get current UTC time and calculate reset times
 */

/**
 * Get the current UTC date and time
 * @returns Date object representing current UTC time
 */
export function getCurrentUTC(): Date {
    return new Date();
}

/**
 * Get the current UTC date as a string in YYYY-MM-DD format
 * @returns UTC date string for daily rate limit keys
 */
export function getCurrentUTCDateString(): string {
    const now = getCurrentUTC();
    return now.toISOString().split('T')[0];
}

/**
 * Get the current UTC month as a string in YYYY-MM format
 * @returns UTC month string for monthly rate limit keys
 */
export function getCurrentUTCMonthString(): string {
    const now = getCurrentUTC();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Calculate the next daily reset time (12:00 AM UTC of the next day)
 * @returns Date object representing the next daily reset time
 */
export function getNextDailyResetTime(): Date {
    const now = getCurrentUTC();
    const nextDay = new Date(now);
    nextDay.setUTCDate(now.getUTCDate() + 1);
    nextDay.setUTCHours(0, 0, 0, 0);
    return nextDay;
}

/**
 * Calculate the next monthly reset time (12:00 AM UTC of the 1st day of next month)
 * @returns Date object representing the next monthly reset time
 */
export function getNextMonthlyResetTime(): Date {
    const now = getCurrentUTC();
    const nextMonth = new Date(now);

    // Move to next month
    if (now.getUTCMonth() === 11) {
        // December -> January of next year
        nextMonth.setUTCFullYear(now.getUTCFullYear() + 1);
        nextMonth.setUTCMonth(0);
    } else {
        nextMonth.setUTCMonth(now.getUTCMonth() + 1);
    }

    // Set to 1st day at 12:00 AM UTC
    nextMonth.setUTCDate(1);
    nextMonth.setUTCHours(0, 0, 0, 0);
    return nextMonth;
}

/**
 * Calculate seconds until the next daily reset (12:00 AM UTC)
 * @returns Number of seconds until daily reset
 */
export function getSecondsUntilDailyReset(): number {
    const now = getCurrentUTC();
    const nextReset = getNextDailyResetTime();
    return Math.ceil((nextReset.getTime() - now.getTime()) / 1000);
}

/**
 * Calculate seconds until the next monthly reset (1st day of next month 12:00 AM UTC)
 * @returns Number of seconds until monthly reset
 */
export function getSecondsUntilMonthlyReset(): number {
    const now = getCurrentUTC();
    const nextReset = getNextMonthlyResetTime();
    return Math.ceil((nextReset.getTime() - now.getTime()) / 1000);
}

/**
 * Check if a given date is in the current UTC day
 * @param date Date to check
 * @returns true if the date is in the current UTC day
 */
export function isCurrentUTCDay(date: Date): boolean {
    const now = getCurrentUTC();
    const currentDay = getCurrentUTCDateString();
    const checkDay = date.toISOString().split('T')[0];
    return currentDay === checkDay;
}

/**
 * Check if a given date is in the current UTC month
 * @param date Date to check
 * @returns true if the date is in the current UTC month
 */
export function isCurrentUTCMonth(date: Date): boolean {
    const now = getCurrentUTC();
    const currentMonth = getCurrentUTCMonthString();
    const checkYear = date.getUTCFullYear();
    const checkMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
    const checkMonthString = `${checkYear}-${checkMonth}`;
    return currentMonth === checkMonthString;
}