import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    DAILY_LIMIT,
    MONTHLY_LIMIT,
    getDailyCounterKey,
    getMonthlyCounterKey,
    getRateLimitData,
    incrementRateLimitCounters,
    checkRateLimit,
    resetRateLimitCounters,
    getRateLimitHeaders,
    checkRequestRateLimit,
    processRequestWithRateLimit,
    getUserQuotaInfo,
    checkRateLimitWarnings,
    type RateLimitData,
    type RateLimitState
} from '../rate-limit';

// Mock the KV client
const mockKvClient = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    pipeline: vi.fn(() => ({
        set: vi.fn(),
        exec: vi.fn()
    }))
};

// Mock the KV module
vi.mock('../kv', () => ({
    kvClient: mockKvClient,
    validateKVEnvironment: vi.fn(() => true)
}));

// Mock time utilities
vi.mock('../time-utils', () => ({
    getCurrentUTCDateString: vi.fn(() => '2024-03-15'),
    getCurrentUTCMonthString: vi.fn(() => '2024-03'),
    getSecondsUntilDailyReset: vi.fn(() => 3600), // 1 hour
    getSecondsUntilMonthlyReset: vi.fn(() => 86400) // 24 hours
}));

describe('Rate Limit Counter Management', () => {
    const testUserHash = 'test-user-hash-123';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-03-15T14:30:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getDailyCounterKey', () => {
        it('should generate correct daily counter key', () => {
            const key = getDailyCounterKey(testUserHash);
            expect(key).toBe('daily:test-user-hash-123:2024-03-15');
        });

        it('should generate different keys for different users', () => {
            const key1 = getDailyCounterKey('user1');
            const key2 = getDailyCounterKey('user2');
            expect(key1).not.toBe(key2);
            expect(key1).toBe('daily:user1:2024-03-15');
            expect(key2).toBe('daily:user2:2024-03-15');
        });
    });

    describe('getMonthlyCounterKey', () => {
        it('should generate correct monthly counter key', () => {
            const key = getMonthlyCounterKey(testUserHash);
            expect(key).toBe('monthly:test-user-hash-123:2024-03');
        });

        it('should generate different keys for different users', () => {
            const key1 = getMonthlyCounterKey('user1');
            const key2 = getMonthlyCounterKey('user2');
            expect(key1).not.toBe(key2);
            expect(key1).toBe('monthly:user1:2024-03');
            expect(key2).toBe('monthly:user2:2024-03');
        });
    });

    describe('getRateLimitData', () => {
        it('should return initial state for new user', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const result = await getRateLimitData(testUserHash);

            expect(result).toEqual({
                dailyCount: 0,
                monthlyCount: 0,
                dailyRemaining: DAILY_LIMIT,
                monthlyRemaining: MONTHLY_LIMIT,
                dailyResetTime: expect.any(Date),
                monthlyResetTime: expect.any(Date),
                isBlocked: false,
                blockType: null
            });
        });

        it('should return existing counter data', async () => {
            const dailyData: RateLimitData = {
                count: 2,
                firstRequest: '2024-03-15T10:00:00.000Z',
                lastRequest: '2024-03-15T14:00:00.000Z'
            };

            const monthlyData: RateLimitData = {
                count: 8,
                firstRequest: '2024-03-01T10:00:00.000Z',
                lastRequest: '2024-03-15T14:00:00.000Z'
            };

            mockKvClient.get
                .mockResolvedValueOnce(dailyData)
                .mockResolvedValueOnce(monthlyData);

            const result = await getRateLimitData(testUserHash);

            expect(result).toEqual({
                dailyCount: 2,
                monthlyCount: 8,
                dailyRemaining: 1, // 3 - 2
                monthlyRemaining: 7, // 15 - 8
                dailyResetTime: expect.any(Date),
                monthlyResetTime: expect.any(Date),
                isBlocked: false,
                blockType: null
            });
        });

        it('should detect daily limit exceeded', async () => {
            const dailyData: RateLimitData = {
                count: 3,
                firstRequest: '2024-03-15T10:00:00.000Z',
                lastRequest: '2024-03-15T14:00:00.000Z'
            };

            mockKvClient.get
                .mockResolvedValueOnce(dailyData)
                .mockResolvedValueOnce(null);

            const result = await getRateLimitData(testUserHash);

            expect(result.isBlocked).toBe(true);
            expect(result.blockType).toBe('daily');
            expect(result.dailyRemaining).toBe(0);
        });

        it('should detect monthly limit exceeded', async () => {
            const monthlyData: RateLimitData = {
                count: 15,
                firstRequest: '2024-03-01T10:00:00.000Z',
                lastRequest: '2024-03-15T14:00:00.000Z'
            };

            mockKvClient.get
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(monthlyData);

            const result = await getRateLimitData(testUserHash);

            expect(result.isBlocked).toBe(true);
            expect(result.blockType).toBe('monthly');
            expect(result.monthlyRemaining).toBe(0);
        });

        it('should prioritize daily block over monthly block', async () => {
            const dailyData: RateLimitData = {
                count: 3,
                firstRequest: '2024-03-15T10:00:00.000Z',
                lastRequest: '2024-03-15T14:00:00.000Z'
            };

            const monthlyData: RateLimitData = {
                count: 15,
                firstRequest: '2024-03-01T10:00:00.000Z',
                lastRequest: '2024-03-15T14:00:00.000Z'
            };

            mockKvClient.get
                .mockResolvedValueOnce(dailyData)
                .mockResolvedValueOnce(monthlyData);

            const result = await getRateLimitData(testUserHash);

            expect(result.isBlocked).toBe(true);
            expect(result.blockType).toBe('daily');
        });

        it('should handle KV errors gracefully', async () => {
            mockKvClient.get.mockRejectedValue(new Error('KV connection failed'));

            const result = await getRateLimitData(testUserHash);

            expect(result.isBlocked).toBe(false);
            expect(result.dailyRemaining).toBe(DAILY_LIMIT);
            expect(result.monthlyRemaining).toBe(MONTHLY_LIMIT);
        });
    });

    describe('incrementRateLimitCounters', () => {
        it('should increment counters for new user', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const result = await incrementRateLimitCounters(testUserHash);

            expect(result.dailyCount).toBe(1);
            expect(result.monthlyCount).toBe(1);
            expect(result.dailyRemaining).toBe(2);
            expect(result.monthlyRemaining).toBe(14);
            expect(result.isBlocked).toBe(false);

            // Verify pipeline operations
            expect(mockPipeline.set).toHaveBeenCalledTimes(2);
            expect(mockPipeline.exec).toHaveBeenCalledTimes(1);
        });

        it('should increment existing counters', async () => {
            const existingDailyData: RateLimitData = {
                count: 1,
                firstRequest: '2024-03-15T10:00:00.000Z',
                lastRequest: '2024-03-15T12:00:00.000Z'
            };

            const existingMonthlyData: RateLimitData = {
                count: 5,
                firstRequest: '2024-03-01T10:00:00.000Z',
                lastRequest: '2024-03-15T12:00:00.000Z'
            };

            mockKvClient.get
                .mockResolvedValueOnce(existingDailyData)
                .mockResolvedValueOnce(existingMonthlyData);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const result = await incrementRateLimitCounters(testUserHash);

            expect(result.dailyCount).toBe(2);
            expect(result.monthlyCount).toBe(6);
            expect(result.dailyRemaining).toBe(1);
            expect(result.monthlyRemaining).toBe(9);
        });

        it('should set TTL for automatic cleanup', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            await incrementRateLimitCounters(testUserHash);

            // Verify TTL is set (3600 + 3600 buffer for daily, 86400 + 3600 buffer for monthly)
            expect(mockPipeline.set).toHaveBeenCalledWith(
                'daily:test-user-hash-123:2024-03-15',
                expect.any(Object),
                { ex: 7200 } // 3600 + 3600 buffer
            );
            expect(mockPipeline.set).toHaveBeenCalledWith(
                'monthly:test-user-hash-123:2024-03',
                expect.any(Object),
                { ex: 90000 } // 86400 + 3600 buffer
            );
        });

        it('should preserve first request timestamp', async () => {
            const existingDailyData: RateLimitData = {
                count: 1,
                firstRequest: '2024-03-15T10:00:00.000Z',
                lastRequest: '2024-03-15T12:00:00.000Z'
            };

            mockKvClient.get
                .mockResolvedValueOnce(existingDailyData)
                .mockResolvedValueOnce(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            await incrementRateLimitCounters(testUserHash);

            // Check that the first request timestamp is preserved
            const dailySetCall = mockPipeline.set.mock.calls.find(call =>
                call[0] === 'daily:test-user-hash-123:2024-03-15'
            );
            expect(dailySetCall[1].firstRequest).toBe('2024-03-15T10:00:00.000Z');
            expect(dailySetCall[1].lastRequest).toBe('2024-03-15T14:30:00.000Z');
        });

        it('should handle pipeline errors gracefully', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockRejectedValue(new Error('Pipeline failed'))
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const result = await incrementRateLimitCounters(testUserHash);

            // Should return current state without incrementing
            expect(result.dailyCount).toBe(0);
            expect(result.monthlyCount).toBe(0);
            expect(result.isBlocked).toBe(false);
        });
    });

    describe('checkRateLimit', () => {
        it('should be an alias for getRateLimitData', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const result = await checkRateLimit(testUserHash);

            expect(result).toEqual({
                dailyCount: 0,
                monthlyCount: 0,
                dailyRemaining: DAILY_LIMIT,
                monthlyRemaining: MONTHLY_LIMIT,
                dailyResetTime: expect.any(Date),
                monthlyResetTime: expect.any(Date),
                isBlocked: false,
                blockType: null
            });
        });
    });

    describe('resetRateLimitCounters', () => {
        it('should delete both daily and monthly counters', async () => {
            mockKvClient.del.mockResolvedValue(1);

            const result = await resetRateLimitCounters(testUserHash);

            expect(result).toBe(true);
            expect(mockKvClient.del).toHaveBeenCalledWith('daily:test-user-hash-123:2024-03-15');
            expect(mockKvClient.del).toHaveBeenCalledWith('monthly:test-user-hash-123:2024-03');
        });

        it('should handle deletion errors gracefully', async () => {
            mockKvClient.del.mockRejectedValue(new Error('Delete failed'));

            const result = await resetRateLimitCounters(testUserHash);

            expect(result).toBe(false);
        });
    });

    describe('getRateLimitHeaders', () => {
        it('should generate correct headers for normal state', () => {
            const rateLimitState: RateLimitState = {
                dailyCount: 1,
                monthlyCount: 5,
                dailyRemaining: 2,
                monthlyRemaining: 10,
                dailyResetTime: new Date('2024-03-16T00:00:00.000Z'),
                monthlyResetTime: new Date('2024-04-01T00:00:00.000Z'),
                isBlocked: false,
                blockType: null
            };

            const headers = getRateLimitHeaders(rateLimitState);

            expect(headers).toEqual({
                'X-RateLimit-Limit-Daily': '3',
                'X-RateLimit-Limit-Monthly': '15',
                'X-RateLimit-Remaining-Daily': '2',
                'X-RateLimit-Remaining-Monthly': '10',
                'X-RateLimit-Reset-Daily': '2024-03-16T00:00:00.000Z',
                'X-RateLimit-Reset-Monthly': '2024-04-01T00:00:00.000Z'
            });
        });

        it('should include Retry-After header when blocked daily', () => {
            const rateLimitState: RateLimitState = {
                dailyCount: 3,
                monthlyCount: 5,
                dailyRemaining: 0,
                monthlyRemaining: 10,
                dailyResetTime: new Date('2024-03-16T00:00:00.000Z'),
                monthlyResetTime: new Date('2024-04-01T00:00:00.000Z'),
                isBlocked: true,
                blockType: 'daily'
            };

            const headers = getRateLimitHeaders(rateLimitState);

            expect(headers['Retry-After']).toBe('3600'); // Seconds until daily reset
        });

        it('should include Retry-After header when blocked monthly', () => {
            const rateLimitState: RateLimitState = {
                dailyCount: 2,
                monthlyCount: 15,
                dailyRemaining: 1,
                monthlyRemaining: 0,
                dailyResetTime: new Date('2024-03-16T00:00:00.000Z'),
                monthlyResetTime: new Date('2024-04-01T00:00:00.000Z'),
                isBlocked: true,
                blockType: 'monthly'
            };

            const headers = getRateLimitHeaders(rateLimitState);

            expect(headers['Retry-After']).toBe('86400'); // Seconds until monthly reset
        });
    });

    describe('KV environment validation', () => {
        it('should handle disabled KV environment gracefully', async () => {
            // Mock KV environment as disabled
            const { validateKVEnvironment } = await import('../kv');
            vi.mocked(validateKVEnvironment).mockReturnValue(false);

            const result = await getRateLimitData(testUserHash);

            expect(result.isBlocked).toBe(false);
            expect(result.dailyRemaining).toBe(DAILY_LIMIT);
            expect(result.monthlyRemaining).toBe(MONTHLY_LIMIT);
        });
    });
}); d
escribe('checkRequestRateLimit', () => {
    it('should allow request for user under limits', async () => {
        const dailyData: RateLimitData = {
            count: 1,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T12:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(null);

        const result = await checkRequestRateLimit(testUserHash);

        expect(result.allowed).toBe(true);
        expect(result.rateLimitState.dailyCount).toBe(1);
        expect(result.rateLimitState.isBlocked).toBe(false);
        expect(result.errorMessage).toBeUndefined();
        expect(result.retryAfter).toBeUndefined();
    });

    it('should block request when daily limit exceeded', async () => {
        const dailyData: RateLimitData = {
            count: 3,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(null);

        const result = await checkRequestRateLimit(testUserHash);

        expect(result.allowed).toBe(false);
        expect(result.rateLimitState.isBlocked).toBe(true);
        expect(result.rateLimitState.blockType).toBe('daily');
        expect(result.errorMessage).toContain('Daily rate limit exceeded');
        expect(result.retryAfter).toBe(3600);
    });

    it('should block request when monthly limit exceeded', async () => {
        const monthlyData: RateLimitData = {
            count: 15,
            firstRequest: '2024-03-01T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(monthlyData);

        const result = await checkRequestRateLimit(testUserHash);

        expect(result.allowed).toBe(false);
        expect(result.rateLimitState.isBlocked).toBe(true);
        expect(result.rateLimitState.blockType).toBe('monthly');
        expect(result.errorMessage).toContain('Monthly rate limit exceeded');
        expect(result.retryAfter).toBe(86400);
    });

    it('should handle errors gracefully and allow request', async () => {
        mockKvClient.get.mockRejectedValue(new Error('KV error'));

        const result = await checkRequestRateLimit(testUserHash);

        expect(result.allowed).toBe(true);
        expect(result.rateLimitState.isBlocked).toBe(false);
        expect(result.rateLimitState.dailyRemaining).toBe(DAILY_LIMIT);
    });
});

describe('processRequestWithRateLimit', () => {
    it('should process request and increment counters when allowed', async () => {
        // Mock initial check - user under limits
        mockKvClient.get.mockResolvedValue(null);

        // Mock increment operation
        const mockPipeline = {
            set: vi.fn(),
            exec: vi.fn().mockResolvedValue([])
        };
        mockKvClient.pipeline.mockReturnValue(mockPipeline);

        const result = await processRequestWithRateLimit(testUserHash);

        expect(result.allowed).toBe(true);
        expect(result.rateLimitState.dailyCount).toBe(1);
        expect(result.rateLimitState.monthlyCount).toBe(1);
        expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('should not increment counters when request is blocked', async () => {
        const dailyData: RateLimitData = {
            count: 3,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(null);

        const result = await processRequestWithRateLimit(testUserHash);

        expect(result.allowed).toBe(false);
        expect(result.errorMessage).toContain('Daily rate limit exceeded');
        expect(mockKvClient.pipeline).not.toHaveBeenCalled();
    });

    it('should handle increment errors gracefully', async () => {
        // Mock initial check - user under limits
        mockKvClient.get.mockResolvedValue(null);

        // Mock increment operation failure
        const mockPipeline = {
            set: vi.fn(),
            exec: vi.fn().mockRejectedValue(new Error('Pipeline failed'))
        };
        mockKvClient.pipeline.mockReturnValue(mockPipeline);

        const result = await processRequestWithRateLimit(testUserHash);

        expect(result.allowed).toBe(true);
        expect(result.rateLimitState.isBlocked).toBe(false);
    });
});

describe('getUserQuotaInfo', () => {
    it('should return quota information for user', async () => {
        const dailyData: RateLimitData = {
            count: 2,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        const monthlyData: RateLimitData = {
            count: 8,
            firstRequest: '2024-03-01T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(monthlyData);

        const result = await getUserQuotaInfo(testUserHash);

        expect(result).toEqual({
            dailyRemaining: 1,
            monthlyRemaining: 7,
            dailyResetTime: expect.any(Date),
            monthlyResetTime: expect.any(Date),
            isBlocked: false,
            blockType: null
        });
    });

    it('should return blocked status when limits exceeded', async () => {
        const dailyData: RateLimitData = {
            count: 3,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(null);

        const result = await getUserQuotaInfo(testUserHash);

        expect(result.isBlocked).toBe(true);
        expect(result.blockType).toBe('daily');
        expect(result.dailyRemaining).toBe(0);
    });
});

describe('checkRateLimitWarnings', () => {
    it('should return no warnings for user with plenty of quota', async () => {
        const dailyData: RateLimitData = {
            count: 1,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        const monthlyData: RateLimitData = {
            count: 5,
            firstRequest: '2024-03-01T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(monthlyData);

        const result = await checkRateLimitWarnings(testUserHash);

        expect(result).toEqual({
            dailyWarning: false,
            monthlyWarning: false,
            dailyRemaining: 2,
            monthlyRemaining: 10
        });
    });

    it('should return daily warning when 1 request remaining', async () => {
        const dailyData: RateLimitData = {
            count: 2,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(null);

        const result = await checkRateLimitWarnings(testUserHash);

        expect(result.dailyWarning).toBe(true);
        expect(result.monthlyWarning).toBe(false);
        expect(result.dailyRemaining).toBe(1);
    });

    it('should return monthly warning when 3 or fewer requests remaining', async () => {
        const monthlyData: RateLimitData = {
            count: 12,
            firstRequest: '2024-03-01T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(monthlyData);

        const result = await checkRateLimitWarnings(testUserHash);

        expect(result.dailyWarning).toBe(false);
        expect(result.monthlyWarning).toBe(true);
        expect(result.monthlyRemaining).toBe(3);
    });

    it('should return both warnings when both thresholds met', async () => {
        const dailyData: RateLimitData = {
            count: 2,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        const monthlyData: RateLimitData = {
            count: 14,
            firstRequest: '2024-03-01T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(monthlyData);

        const result = await checkRateLimitWarnings(testUserHash);

        expect(result.dailyWarning).toBe(true);
        expect(result.monthlyWarning).toBe(true);
        expect(result.dailyRemaining).toBe(1);
        expect(result.monthlyRemaining).toBe(1);
    });

    it('should not warn when limits are already exceeded', async () => {
        const dailyData: RateLimitData = {
            count: 3,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(null);

        const result = await checkRateLimitWarnings(testUserHash);

        expect(result.dailyWarning).toBe(false); // 0 remaining, not warning threshold
        expect(result.monthlyWarning).toBe(false);
        expect(result.dailyRemaining).toBe(0);
    });
});

describe('Edge cases and error handling', () => {
    it('should handle new user with no existing data', async () => {
        mockKvClient.get.mockResolvedValue(null);

        const checkResult = await checkRequestRateLimit(testUserHash);
        const quotaResult = await getUserQuotaInfo(testUserHash);
        const warningResult = await checkRateLimitWarnings(testUserHash);

        expect(checkResult.allowed).toBe(true);
        expect(quotaResult.dailyRemaining).toBe(DAILY_LIMIT);
        expect(quotaResult.monthlyRemaining).toBe(MONTHLY_LIMIT);
        expect(warningResult.dailyWarning).toBe(false);
        expect(warningResult.monthlyWarning).toBe(false);
    });

    it('should handle partial data (daily exists, monthly missing)', async () => {
        const dailyData: RateLimitData = {
            count: 1,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(null);

        const result = await checkRequestRateLimit(testUserHash);

        expect(result.allowed).toBe(true);
        expect(result.rateLimitState.dailyCount).toBe(1);
        expect(result.rateLimitState.monthlyCount).toBe(0);
    });

    it('should handle partial data (monthly exists, daily missing)', async () => {
        const monthlyData: RateLimitData = {
            count: 5,
            firstRequest: '2024-03-01T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(monthlyData);

        const result = await checkRequestRateLimit(testUserHash);

        expect(result.allowed).toBe(true);
        expect(result.rateLimitState.dailyCount).toBe(0);
        expect(result.rateLimitState.monthlyCount).toBe(5);
    });

    it('should handle timezone edge cases around reset times', async () => {
        // Test at exactly midnight UTC
        vi.setSystemTime(new Date('2024-03-16T00:00:00.000Z'));

        const result = await getRateLimitData(testUserHash);

        expect(result.dailyResetTime.toISOString()).toBe('2024-03-17T00:00:00.000Z');
        expect(result.monthlyResetTime.toISOString()).toBe('2024-04-01T00:00:00.000Z');
    });

    it('should handle month boundary edge cases', async () => {
        // Test at end of February in leap year
        vi.setSystemTime(new Date('2024-02-29T23:59:59.999Z'));

        const result = await getRateLimitData(testUserHash);

        expect(result.dailyResetTime.toISOString()).toBe('2024-03-01T00:00:00.000Z');
        expect(result.monthlyResetTime.toISOString()).toBe('2024-03-01T00:00:00.000Z');
    });

    it('should handle year boundary edge cases', async () => {
        // Test at end of December
        vi.setSystemTime(new Date('2024-12-31T23:59:59.999Z'));

        const result = await getRateLimitData(testUserHash);

        expect(result.dailyResetTime.toISOString()).toBe('2025-01-01T00:00:00.000Z');
        expect(result.monthlyResetTime.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should handle concurrent requests with race conditions', async () => {
        mockKvClient.get.mockResolvedValue(null);

        const mockPipeline = {
            set: vi.fn(),
            exec: vi.fn().mockResolvedValue([])
        };
        mockKvClient.pipeline.mockReturnValue(mockPipeline);

        // Simulate concurrent requests
        const promises = Array.from({ length: 5 }, () =>
            processRequestWithRateLimit(testUserHash)
        );

        const results = await Promise.all(promises);

        // All should be allowed since we're mocking successful operations
        results.forEach(result => {
            expect(result.allowed).toBe(true);
        });

        // Pipeline should have been called for each request
        expect(mockPipeline.exec).toHaveBeenCalledTimes(5);
    });

    it('should handle malformed data in KV storage', async () => {
        // Mock malformed data that doesn't match RateLimitData interface
        mockKvClient.get
            .mockResolvedValueOnce({ invalid: 'data' })
            .mockResolvedValueOnce('not an object');

        const result = await getRateLimitData(testUserHash);

        // Should handle gracefully and return fallback state
        expect(result.dailyCount).toBe(0);
        expect(result.monthlyCount).toBe(0);
        expect(result.isBlocked).toBe(false);
    });

    it('should handle very large counter values', async () => {
        const dailyData: RateLimitData = {
            count: 999999,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(null);

        const result = await getRateLimitData(testUserHash);

        expect(result.dailyCount).toBe(999999);
        expect(result.dailyRemaining).toBe(0); // Should be capped at 0
        expect(result.isBlocked).toBe(true);
        expect(result.blockType).toBe('daily');
    });

    it('should handle negative counter values gracefully', async () => {
        const dailyData: RateLimitData = {
            count: -1,
            firstRequest: '2024-03-15T10:00:00.000Z',
            lastRequest: '2024-03-15T14:00:00.000Z'
        };

        mockKvClient.get
            .mockResolvedValueOnce(dailyData)
            .mockResolvedValueOnce(null);

        const result = await getRateLimitData(testUserHash);

        expect(result.dailyCount).toBe(-1);
        expect(result.dailyRemaining).toBe(4); // 3 - (-1) = 4
        expect(result.isBlocked).toBe(false);
    });
});

describe('Performance and reliability', () => {
    it('should handle KV timeout errors', async () => {
        const timeoutError = new Error('Operation timed out');
        timeoutError.name = 'TimeoutError';

        mockKvClient.get.mockRejectedValue(timeoutError);

        const result = await checkRequestRateLimit(testUserHash);

        expect(result.allowed).toBe(true); // Should be permissive on errors
        expect(result.rateLimitState.dailyRemaining).toBe(DAILY_LIMIT);
    });

    it('should handle KV connection errors', async () => {
        const connectionError = new Error('Connection refused');
        connectionError.name = 'ConnectionError';

        mockKvClient.get.mockRejectedValue(connectionError);

        const result = await processRequestWithRateLimit(testUserHash);

        expect(result.allowed).toBe(true); // Should be permissive on errors
        expect(result.rateLimitState.isBlocked).toBe(false);
    });

    it('should handle pipeline execution failures gracefully', async () => {
        mockKvClient.get.mockResolvedValue(null);

        const mockPipeline = {
            set: vi.fn(),
            exec: vi.fn().mockRejectedValue(new Error('Pipeline execution failed'))
        };
        mockKvClient.pipeline.mockReturnValue(mockPipeline);

        const result = await incrementRateLimitCounters(testUserHash);

        // Should return current state without incrementing
        expect(result.dailyCount).toBe(0);
        expect(result.monthlyCount).toBe(0);
        expect(result.isBlocked).toBe(false);
    });

    it('should handle partial pipeline failures', async () => {
        mockKvClient.get.mockResolvedValue(null);

        const mockPipeline = {
            set: vi.fn(),
            exec: vi.fn().mockResolvedValue([
                { error: 'Daily counter failed' },
                null // Monthly counter succeeded
            ])
        };
        mockKvClient.pipeline.mockReturnValue(mockPipeline);

        const result = await incrementRateLimitCounters(testUserHash);

        // Should still handle gracefully
        expect(result.dailyCount).toBe(1);
        expect(result.monthlyCount).toBe(1);
    });
});

describe('Security and validation', () => {
    it('should handle suspicious user hash patterns', async () => {
        const suspiciousHash = '<script>alert("xss")</script>';

        mockKvClient.get.mockResolvedValue(null);

        const result = await getRateLimitData(suspiciousHash);

        // Should still work but log the suspicious pattern
        expect(result.dailyRemaining).toBe(DAILY_LIMIT);
        expect(result.monthlyRemaining).toBe(MONTHLY_LIMIT);
    });

    it('should handle very long user hash values', async () => {
        const longHash = 'a'.repeat(1000);

        mockKvClient.get.mockResolvedValue(null);

        const result = await getRateLimitData(longHash);

        expect(result.dailyRemaining).toBe(DAILY_LIMIT);
        expect(result.monthlyRemaining).toBe(MONTHLY_LIMIT);
    });

    it('should handle empty or null user hash', async () => {
        const results = await Promise.all([
            getRateLimitData(''),
            getRateLimitData(null as any),
            getRateLimitData(undefined as any)
        ]);

        results.forEach(result => {
            expect(result.dailyRemaining).toBe(DAILY_LIMIT);
            expect(result.monthlyRemaining).toBe(MONTHLY_LIMIT);
            expect(result.isBlocked).toBe(false);
        });
    });
});
});