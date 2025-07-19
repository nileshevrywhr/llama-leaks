import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getCurrentUTC,
    getCurrentUTCDateString,
    getCurrentUTCMonthString,
    getNextDailyResetTime,
    getNextMonthlyResetTime,
    getSecondsUntilDailyReset,
    getSecondsUntilMonthlyReset,
    isCurrentUTCDay,
    isCurrentUTCMonth,
} from '../time-utils';

describe('Time Utils', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getCurrentUTC', () => {
        it('should return current UTC time', () => {
            const mockDate = new Date('2024-03-15T14:30:45.123Z');
            vi.setSystemTime(mockDate);

            const result = getCurrentUTC();
            expect(result.getTime()).toBe(mockDate.getTime());
        });
    });

    describe('getCurrentUTCDateString', () => {
        it('should return current UTC date in YYYY-MM-DD format', () => {
            vi.setSystemTime(new Date('2024-03-15T14:30:45.123Z'));

            const result = getCurrentUTCDateString();
            expect(result).toBe('2024-03-15');
        });

        it('should handle single digit months and days', () => {
            vi.setSystemTime(new Date('2024-01-05T14:30:45.123Z'));

            const result = getCurrentUTCDateString();
            expect(result).toBe('2024-01-05');
        });

        it('should handle year boundaries', () => {
            vi.setSystemTime(new Date('2023-12-31T23:59:59.999Z'));

            const result = getCurrentUTCDateString();
            expect(result).toBe('2023-12-31');
        });
    });

    describe('getCurrentUTCMonthString', () => {
        it('should return current UTC month in YYYY-MM format', () => {
            vi.setSystemTime(new Date('2024-03-15T14:30:45.123Z'));

            const result = getCurrentUTCMonthString();
            expect(result).toBe('2024-03');
        });

        it('should handle single digit months', () => {
            vi.setSystemTime(new Date('2024-01-15T14:30:45.123Z'));

            const result = getCurrentUTCMonthString();
            expect(result).toBe('2024-01');
        });

        it('should handle December', () => {
            vi.setSystemTime(new Date('2024-12-15T14:30:45.123Z'));

            const result = getCurrentUTCMonthString();
            expect(result).toBe('2024-12');
        });
    });

    describe('getNextDailyResetTime', () => {
        it('should return next day at 12:00 AM UTC', () => {
            vi.setSystemTime(new Date('2024-03-15T14:30:45.123Z'));

            const result = getNextDailyResetTime();
            expect(result.toISOString()).toBe('2024-03-16T00:00:00.000Z');
        });

        it('should handle month boundaries', () => {
            vi.setSystemTime(new Date('2024-03-31T23:59:59.999Z'));

            const result = getNextDailyResetTime();
            expect(result.toISOString()).toBe('2024-04-01T00:00:00.000Z');
        });

        it('should handle year boundaries', () => {
            vi.setSystemTime(new Date('2024-12-31T23:59:59.999Z'));

            const result = getNextDailyResetTime();
            expect(result.toISOString()).toBe('2025-01-01T00:00:00.000Z');
        });

        it('should handle leap year February', () => {
            vi.setSystemTime(new Date('2024-02-28T14:30:45.123Z'));

            const result = getNextDailyResetTime();
            expect(result.toISOString()).toBe('2024-02-29T00:00:00.000Z');
        });

        it('should handle non-leap year February', () => {
            vi.setSystemTime(new Date('2023-02-28T14:30:45.123Z'));

            const result = getNextDailyResetTime();
            expect(result.toISOString()).toBe('2023-03-01T00:00:00.000Z');
        });
    });

    describe('getNextMonthlyResetTime', () => {
        it('should return 1st day of next month at 12:00 AM UTC', () => {
            vi.setSystemTime(new Date('2024-03-15T14:30:45.123Z'));

            const result = getNextMonthlyResetTime();
            expect(result.toISOString()).toBe('2024-04-01T00:00:00.000Z');
        });

        it('should handle December to January transition', () => {
            vi.setSystemTime(new Date('2024-12-15T14:30:45.123Z'));

            const result = getNextMonthlyResetTime();
            expect(result.toISOString()).toBe('2025-01-01T00:00:00.000Z');
        });

        it('should handle end of December', () => {
            vi.setSystemTime(new Date('2024-12-31T23:59:59.999Z'));

            const result = getNextMonthlyResetTime();
            expect(result.toISOString()).toBe('2025-01-01T00:00:00.000Z');
        });

        it('should handle February to March', () => {
            vi.setSystemTime(new Date('2024-02-29T14:30:45.123Z'));

            const result = getNextMonthlyResetTime();
            expect(result.toISOString()).toBe('2024-03-01T00:00:00.000Z');
        });

        it('should handle January to February', () => {
            vi.setSystemTime(new Date('2024-01-31T14:30:45.123Z'));

            const result = getNextMonthlyResetTime();
            expect(result.toISOString()).toBe('2024-02-01T00:00:00.000Z');
        });
    });

    describe('getSecondsUntilDailyReset', () => {
        it('should calculate correct seconds until next day', () => {
            // 2 hours and 30 minutes before midnight
            vi.setSystemTime(new Date('2024-03-15T21:30:00.000Z'));

            const result = getSecondsUntilDailyReset();
            // 2.5 hours = 9000 seconds
            expect(result).toBe(9000);
        });

        it('should handle seconds precision', () => {
            // 1 minute and 30 seconds before midnight
            vi.setSystemTime(new Date('2024-03-15T23:58:30.000Z'));

            const result = getSecondsUntilDailyReset();
            // 1.5 minutes = 90 seconds
            expect(result).toBe(90);
        });

        it('should round up partial seconds', () => {
            // 30.5 seconds before midnight
            vi.setSystemTime(new Date('2024-03-15T23:59:29.500Z'));

            const result = getSecondsUntilDailyReset();
            // Should round up to 31 seconds
            expect(result).toBe(31);
        });
    });

    describe('getSecondsUntilMonthlyReset', () => {
        it('should calculate correct seconds until next month', () => {
            // March 31st at noon - 12 hours until April 1st
            vi.setSystemTime(new Date('2024-03-31T12:00:00.000Z'));

            const result = getSecondsUntilMonthlyReset();
            // 12 hours = 43200 seconds
            expect(result).toBe(43200);
        });

        it('should handle December to January transition', () => {
            // December 31st at noon - 12 hours until January 1st
            vi.setSystemTime(new Date('2024-12-31T12:00:00.000Z'));

            const result = getSecondsUntilMonthlyReset();
            // 12 hours = 43200 seconds
            expect(result).toBe(43200);
        });

        it('should handle beginning of month', () => {
            // March 1st at noon - about 30 days until April 1st
            vi.setSystemTime(new Date('2024-03-01T12:00:00.000Z'));

            const result = getSecondsUntilMonthlyReset();
            // 30.5 days = 2,635,200 seconds
            expect(result).toBe(2635200);
        });
    });

    describe('isCurrentUTCDay', () => {
        beforeEach(() => {
            vi.setSystemTime(new Date('2024-03-15T14:30:45.123Z'));
        });

        it('should return true for same UTC day', () => {
            const sameDay = new Date('2024-03-15T08:00:00.000Z');
            expect(isCurrentUTCDay(sameDay)).toBe(true);
        });

        it('should return true for same UTC day different time', () => {
            const sameDay = new Date('2024-03-15T23:59:59.999Z');
            expect(isCurrentUTCDay(sameDay)).toBe(true);
        });

        it('should return false for previous day', () => {
            const previousDay = new Date('2024-03-14T23:59:59.999Z');
            expect(isCurrentUTCDay(previousDay)).toBe(false);
        });

        it('should return false for next day', () => {
            const nextDay = new Date('2024-03-16T00:00:00.000Z');
            expect(isCurrentUTCDay(nextDay)).toBe(false);
        });

        it('should handle month boundaries', () => {
            vi.setSystemTime(new Date('2024-03-01T14:30:45.123Z'));

            const previousMonth = new Date('2024-02-29T23:59:59.999Z');
            expect(isCurrentUTCDay(previousMonth)).toBe(false);
        });
    });

    describe('isCurrentUTCMonth', () => {
        beforeEach(() => {
            vi.setSystemTime(new Date('2024-03-15T14:30:45.123Z'));
        });

        it('should return true for same UTC month', () => {
            const sameMonth = new Date('2024-03-01T08:00:00.000Z');
            expect(isCurrentUTCMonth(sameMonth)).toBe(true);
        });

        it('should return true for end of same month', () => {
            const sameMonth = new Date('2024-03-31T23:59:59.999Z');
            expect(isCurrentUTCMonth(sameMonth)).toBe(true);
        });

        it('should return false for previous month', () => {
            const previousMonth = new Date('2024-02-29T23:59:59.999Z');
            expect(isCurrentUTCMonth(previousMonth)).toBe(false);
        });

        it('should return false for next month', () => {
            const nextMonth = new Date('2024-04-01T00:00:00.000Z');
            expect(isCurrentUTCMonth(nextMonth)).toBe(false);
        });

        it('should handle year boundaries', () => {
            vi.setSystemTime(new Date('2024-01-15T14:30:45.123Z'));

            const previousYear = new Date('2023-12-31T23:59:59.999Z');
            expect(isCurrentUTCMonth(previousYear)).toBe(false);
        });

        it('should handle December to January', () => {
            vi.setSystemTime(new Date('2024-12-15T14:30:45.123Z'));

            const nextYear = new Date('2025-01-01T00:00:00.000Z');
            expect(isCurrentUTCMonth(nextYear)).toBe(false);
        });
    });
});