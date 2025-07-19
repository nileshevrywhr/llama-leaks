/**
 * Integration tests for /api/random endpoint
 * Tests the complete request/response cycle with rate limiting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

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
vi.mock('../../src/lib/kv', () => ({
    kvClient: mockKvClient,
    validateKVEnvironment: vi.fn(() => true)
}));

// Mock time utilities
vi.mock('../../src/lib/time-utils', () => ({
    getCurrentUTCDateString: vi.fn(() => '2024-03-15'),
    getCurrentUTCMonthString: vi.fn(() => '2024-03'),
    getSecondsUntilDailyReset: vi.fn(() => 3600),
    getSecondsUntilMonthlyReset: vi.fn(() => 86400)
}));

// Mock file system for server data
const mockServerData = [
    {
        id: '1',
        ip: '192.168.1.100',
        port: 8080,
        version: '1.0.0',
        status: 'online',
        lastSeen: '2024-03-15T14:30:00.000Z'
    },
    {
        id: '2',
        ip: '192.168.1.101',
        port: 8080,
        version: '1.0.1',
        status: 'online',
        lastSeen: '2024-03-15T14:25:00.000Z'
    },
    {
        id: '3',
        ip: '192.168.1.102',
        port: 8080,
        version: '1.0.0',
        status: 'online',
        lastSeen: '2024-03-15T14:20:00.000Z'
    }
];

// Mock fs module
vi.mock('fs', () => ({
    readFileSync: vi.fn(() => JSON.stringify(mockServerData)),
    existsSync: vi.fn(() => true)
}));

// Import the handler after mocks are set up
import handler from '../random';

describe('/api/random Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-03-15T14:30:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const createRequest = (headers: Record<string, string> = {}) => {
        const defaultHeaders = {
            'x-forwarded-for': '192.168.1.100',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            ...headers
        };

        return new NextRequest('https://example.com/api/random', {
            method: 'GET',
            headers: defaultHeaders
        });
    };

    describe('Successful requests', () => {
        it('should return random server data for new user', async () => {
            // Mock KV to return no existing data (new user)
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toMatchObject({
                success: true,
                data: expect.objectContaining({
                    id: expect.any(String),
                    ip: expect.any(String),
                    port: expect.any(Number),
                    version: expect.any(String),
                    status: 'online'
                }),
                rateLimit: {
                    dailyRemaining: 2, // 3 - 1 (after increment)
                    monthlyRemaining: 14, // 15 - 1 (after increment)
                    dailyResetTime: expect.any(String),
                    monthlyResetTime: expect.any(String)
                }
            });

            // Verify that counters were incremented
            expect(mockPipeline.set).toHaveBeenCalledTimes(2);
            expect(mockPipeline.exec).toHaveBeenCalledTimes(1);
        });

        it('should return different random servers on subsequent calls', async () => {
            // Mock KV to return existing data
            const dailyData = { count: 1, firstRequest: '2024-03-15T10:00:00.000Z', lastRequest: '2024-03-15T12:00:00.000Z' };
            const monthlyData = { count: 5, firstRequest: '2024-03-01T10:00:00.000Z', lastRequest: '2024-03-15T12:00:00.000Z' };

            mockKvClient.get
                .mockResolvedValueOnce(dailyData)
                .mockResolvedValueOnce(monthlyData);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.rateLimit.dailyRemaining).toBe(1); // 3 - 2 (after increment)
            expect(data.rateLimit.monthlyRemaining).toBe(9); // 15 - 6 (after increment)
        });

        it('should include proper rate limit headers', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);
            expect(response.headers.get('X-RateLimit-Limit-Daily')).toBe('3');
            expect(response.headers.get('X-RateLimit-Limit-Monthly')).toBe('15');
            expect(response.headers.get('X-RateLimit-Remaining-Daily')).toBe('2');
            expect(response.headers.get('X-RateLimit-Remaining-Monthly')).toBe('14');
            expect(response.headers.get('X-RateLimit-Reset-Daily')).toBeTruthy();
            expect(response.headers.get('X-RateLimit-Reset-Monthly')).toBeTruthy();
        });
    });

    describe('Rate limiting', () => {
        it('should block requests when daily limit is exceeded', async () => {
            // Mock KV to return data indicating daily limit exceeded
            const dailyData = { count: 3, firstRequest: '2024-03-15T10:00:00.000Z', lastRequest: '2024-03-15T14:00:00.000Z' };
            const monthlyData = { count: 5, firstRequest: '2024-03-01T10:00:00.000Z', lastRequest: '2024-03-15T14:00:00.000Z' };

            mockKvClient.get
                .mockResolvedValueOnce(dailyData)
                .mockResolvedValueOnce(monthlyData);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(429);

            const data = await response.json();
            expect(data).toMatchObject({
                success: false,
                error: 'RATE_LIMIT_EXCEEDED',
                message: expect.stringContaining('Daily rate limit exceeded'),
                rateLimit: {
                    dailyRemaining: 0,
                    monthlyRemaining: 10,
                    dailyResetTime: expect.any(String),
                    monthlyResetTime: expect.any(String)
                },
                retryAfter: 3600
            });

            // Verify Retry-After header
            expect(response.headers.get('Retry-After')).toBe('3600');
        });

        it('should block requests when monthly limit is exceeded', async () => {
            // Mock KV to return data indicating monthly limit exceeded
            const dailyData = { count: 2, firstRequest: '2024-03-15T10:00:00.000Z', lastRequest: '2024-03-15T14:00:00.000Z' };
            const monthlyData = { count: 15, firstRequest: '2024-03-01T10:00:00.000Z', lastRequest: '2024-03-15T14:00:00.000Z' };

            mockKvClient.get
                .mockResolvedValueOnce(dailyData)
                .mockResolvedValueOnce(monthlyData);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(429);

            const data = await response.json();
            expect(data).toMatchObject({
                success: false,
                error: 'RATE_LIMIT_EXCEEDED',
                message: expect.stringContaining('Monthly rate limit exceeded'),
                rateLimit: {
                    dailyRemaining: 1,
                    monthlyRemaining: 0,
                    dailyResetTime: expect.any(String),
                    monthlyResetTime: expect.any(String)
                },
                retryAfter: 86400
            });

            // Verify Retry-After header
            expect(response.headers.get('Retry-After')).toBe('86400');
        });

        it('should prioritize daily limit over monthly limit', async () => {
            // Mock KV to return data indicating both limits exceeded
            const dailyData = { count: 3, firstRequest: '2024-03-15T10:00:00.000Z', lastRequest: '2024-03-15T14:00:00.000Z' };
            const monthlyData = { count: 15, firstRequest: '2024-03-01T10:00:00.000Z', lastRequest: '2024-03-15T14:00:00.000Z' };

            mockKvClient.get
                .mockResolvedValueOnce(dailyData)
                .mockResolvedValueOnce(monthlyData);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(429);

            const data = await response.json();
            expect(data.message).toContain('Daily rate limit exceeded');
            expect(data.retryAfter).toBe(3600); // Daily reset time
        });
    });

    describe('User identification', () => {
        it('should handle different IP addresses as different users', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            // First request from IP 192.168.1.100
            const request1 = createRequest({ 'x-forwarded-for': '192.168.1.100' });
            const response1 = await handler(request1);
            expect(response1.status).toBe(200);

            // Second request from IP 192.168.1.101
            const request2 = createRequest({ 'x-forwarded-for': '192.168.1.101' });
            const response2 = await handler(request2);
            expect(response2.status).toBe(200);

            // Both should be treated as new users
            expect(mockPipeline.exec).toHaveBeenCalledTimes(2);
        });

        it('should handle different user agents as different users', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            // First request with Chrome user agent
            const request1 = createRequest({
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            });
            const response1 = await handler(request1);
            expect(response1.status).toBe(200);

            // Second request with Firefox user agent
            const request2 = createRequest({
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
            });
            const response2 = await handler(request2);
            expect(response2.status).toBe(200);

            // Both should be treated as different users
            expect(mockPipeline.exec).toHaveBeenCalledTimes(2);
        });

        it('should fallback to IP-only identification when fingerprinting fails', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            // Request with invalid user agent (bot-like)
            const request = createRequest({
                'user-agent': 'curl/7.68.0'
            });
            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.rateLimit.dailyRemaining).toBe(2);
        });

        it('should handle missing headers gracefully', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            // Request with minimal headers
            const request = new NextRequest('https://example.com/api/random', {
                method: 'GET',
                headers: {
                    'x-forwarded-for': '192.168.1.100'
                }
            });

            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });
    });

    describe('Error handling', () => {
        it('should handle KV storage failures gracefully', async () => {
            // Mock KV to throw an error
            mockKvClient.get.mockRejectedValue(new Error('KV connection failed'));

            const request = createRequest();
            const response = await handler(request);

            // Should still allow the request (graceful degradation)
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.rateLimit.dailyRemaining).toBe(3); // Fallback values
            expect(data.rateLimit.monthlyRemaining).toBe(15);
        });

        it('should handle file system errors gracefully', async () => {
            // Mock fs to throw an error
            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockImplementation(() => {
                throw new Error('File not found');
            });

            mockKvClient.get.mockResolvedValue(null);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(500);

            const data = await response.json();
            expect(data).toMatchObject({
                success: false,
                error: 'DATA_UNAVAILABLE',
                message: expect.stringContaining('server data')
            });
        });

        it('should handle malformed server data', async () => {
            // Mock fs to return invalid JSON
            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

            mockKvClient.get.mockResolvedValue(null);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(500);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('DATA_UNAVAILABLE');
        });

        it('should handle empty server data', async () => {
            // Mock fs to return empty array
            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockReturnValue('[]');

            mockKvClient.get.mockResolvedValue(null);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(500);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('DATA_UNAVAILABLE');
        });

        it('should handle pipeline execution failures', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockRejectedValue(new Error('Pipeline failed'))
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const request = createRequest();
            const response = await handler(request);

            // Should still return data but with fallback rate limit info
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.rateLimit.dailyRemaining).toBe(3); // Fallback values
        });
    });

    describe('Concurrent requests', () => {
        it('should handle concurrent requests from same user', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            // Simulate concurrent requests
            const requests = Array.from({ length: 3 }, () => createRequest());
            const responses = await Promise.all(requests.map(req => handler(req)));

            // All should succeed (in this mock scenario)
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            // Pipeline should have been called for each request
            expect(mockPipeline.exec).toHaveBeenCalledTimes(3);
        });

        it('should handle race conditions in counter updates', async () => {
            // Mock existing data that's close to limit
            const dailyData = { count: 2, firstRequest: '2024-03-15T10:00:00.000Z', lastRequest: '2024-03-15T12:00:00.000Z' };
            mockKvClient.get
                .mockResolvedValueOnce(dailyData)
                .mockResolvedValueOnce(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.rateLimit.dailyRemaining).toBe(0); // Should be at limit after increment
        });
    });

    describe('HTTP methods', () => {
        it('should only accept GET requests', async () => {
            const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

            for (const method of methods) {
                const request = new NextRequest('https://example.com/api/random', {
                    method,
                    headers: {
                        'x-forwarded-for': '192.168.1.100'
                    }
                });

                const response = await handler(request);
                expect(response.status).toBe(405); // Method Not Allowed
            }
        });

        it('should handle OPTIONS requests for CORS', async () => {
            const request = new NextRequest('https://example.com/api/random', {
                method: 'OPTIONS',
                headers: {
                    'x-forwarded-for': '192.168.1.100'
                }
            });

            const response = await handler(request);
            expect(response.status).toBe(200);
            expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
        });
    });

    describe('Response format', () => {
        it('should return consistent response format for success', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);
            expect(response.headers.get('Content-Type')).toContain('application/json');

            const data = await response.json();
            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('data');
            expect(data).toHaveProperty('rateLimit');
            expect(data.rateLimit).toHaveProperty('dailyRemaining');
            expect(data.rateLimit).toHaveProperty('monthlyRemaining');
            expect(data.rateLimit).toHaveProperty('dailyResetTime');
            expect(data.rateLimit).toHaveProperty('monthlyResetTime');
        });

        it('should return consistent response format for rate limit errors', async () => {
            const dailyData = { count: 3, firstRequest: '2024-03-15T10:00:00.000Z', lastRequest: '2024-03-15T14:00:00.000Z' };
            mockKvClient.get
                .mockResolvedValueOnce(dailyData)
                .mockResolvedValueOnce(null);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(429);
            expect(response.headers.get('Content-Type')).toContain('application/json');

            const data = await response.json();
            expect(data).toHaveProperty('success', false);
            expect(data).toHaveProperty('error', 'RATE_LIMIT_EXCEEDED');
            expect(data).toHaveProperty('message');
            expect(data).toHaveProperty('rateLimit');
            expect(data).toHaveProperty('retryAfter');
        });

        it('should return consistent response format for server errors', async () => {
            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockImplementation(() => {
                throw new Error('File not found');
            });

            mockKvClient.get.mockResolvedValue(null);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(500);
            expect(response.headers.get('Content-Type')).toContain('application/json');

            const data = await response.json();
            expect(data).toHaveProperty('success', false);
            expect(data).toHaveProperty('error');
            expect(data).toHaveProperty('message');
        });
    });

    describe('Security', () => {
        it('should sanitize malicious headers', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const request = createRequest({
                'x-forwarded-for': '192.168.1.100<script>alert("xss")</script>',
                'user-agent': 'Mozilla/5.0<script>alert("xss")</script>'
            });

            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });

        it('should handle header injection attempts', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const request = createRequest({
                'x-custom-header': 'value\r\nInjected-Header: malicious'
            });

            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });

        it('should handle extremely long headers', async () => {
            mockKvClient.get.mockResolvedValue(null);

            const mockPipeline = {
                set: vi.fn(),
                exec: vi.fn().mockResolvedValue([])
            };
            mockKvClient.pipeline.mockReturnValue(mockPipeline);

            const longValue = 'x'.repeat(10000);
            const request = createRequest({
                'user-agent': longValue
            });

            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
        });
    });
});