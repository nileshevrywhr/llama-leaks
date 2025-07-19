/**
 * Integration tests for /api/stats endpoint
 * Tests the complete request/response cycle for statistics endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock server data
const mockServerData = [
    {
        id: '1',
        ip: '192.168.1.100',
        port: 8080,
        version: '1.0.0',
        status: 'online',
        lastSeen: '2024-03-15T14:30:00.000Z',
        firstSeen: '2024-03-15T10:00:00.000Z'
    },
    {
        id: '2',
        ip: '192.168.1.101',
        port: 8080,
        version: '1.0.1',
        status: 'online',
        lastSeen: '2024-03-15T14:25:00.000Z',
        firstSeen: '2024-03-15T08:00:00.000Z'
    },
    {
        id: '3',
        ip: '192.168.1.102',
        port: 8080,
        version: '1.0.0',
        status: 'offline',
        lastSeen: '2024-03-14T20:00:00.000Z',
        firstSeen: '2024-03-14T18:00:00.000Z'
    },
    {
        id: '4',
        ip: '192.168.1.103',
        port: 8080,
        version: '1.0.2',
        status: 'online',
        lastSeen: '2024-03-15T14:20:00.000Z',
        firstSeen: '2024-03-15T14:15:00.000Z' // New today
    }
];

// Mock fs module
vi.mock('fs', () => ({
    readFileSync: vi.fn(() => JSON.stringify(mockServerData)),
    existsSync: vi.fn(() => true)
}));

// Import the handler after mocks are set up
import handler from '../stats';

describe('/api/stats Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-03-15T14:30:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const createRequest = (headers: Record<string, string> = {}) => {
        return new NextRequest('https://example.com/api/stats', {
            method: 'GET',
            headers: headers
        });
    };

    describe('Successful requests', () => {
        it('should return aggregate statistics', async () => {
            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toMatchObject({
                success: true,
                statistics: {
                    totalServers: 4,
                    liveServers: 3, // Only online servers
                    newToday: 1, // Servers first seen today
                    latestFindMinutes: expect.any(Number)
                },
                lastUpdated: expect.any(String)
            });

            // Verify the latest find calculation
            expect(data.statistics.latestFindMinutes).toBeGreaterThanOrEqual(0);
        });

        it('should include proper cache headers', async () => {
            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);
            expect(response.headers.get('Cache-Control')).toBe('public, max-age=300');
            expect(response.headers.get('Content-Type')).toContain('application/json');
        });

        it('should calculate statistics correctly', async () => {
            const request = createRequest();
            const response = await handler(request);

            const data = await response.json();

            // Total servers should be all servers
            expect(data.statistics.totalServers).toBe(4);

            // Live servers should only count online servers
            expect(data.statistics.liveServers).toBe(3);

            // New today should count servers first seen today (2024-03-15)
            expect(data.statistics.newToday).toBe(1);

            // Latest find should be calculated from most recent lastSeen
            const mostRecentServer = mockServerData
                .filter(s => s.status === 'online')
                .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())[0];

            const expectedMinutes = Math.floor(
                (new Date('2024-03-15T14:30:00.000Z').getTime() - new Date(mostRecentServer.lastSeen).getTime()) / (1000 * 60)
            );

            expect(data.statistics.latestFindMinutes).toBe(expectedMinutes);
        });

        it('should use cached data on subsequent requests', async () => {
            const fs = await import('fs');
            const readFileSyncSpy = vi.mocked(fs.readFileSync);

            // First request
            const request1 = createRequest();
            const response1 = await handler(request1);
            expect(response1.status).toBe(200);

            // Second request (should use cache)
            const request2 = createRequest();
            const response2 = await handler(request2);
            expect(response2.status).toBe(200);

            // File should only be read once due to caching
            expect(readFileSyncSpy).toHaveBeenCalledTimes(1);

            const data1 = await response1.json();
            const data2 = await response2.json();

            expect(data1.statistics).toEqual(data2.statistics);
        });

        it('should refresh cache after TTL expires', async () => {
            const fs = await import('fs');
            const readFileSyncSpy = vi.mocked(fs.readFileSync);

            // First request
            const request1 = createRequest();
            const response1 = await handler(request1);
            expect(response1.status).toBe(200);

            // Advance time by more than cache TTL (5 minutes)
            vi.advanceTimersByTime(6 * 60 * 1000);

            // Second request (should refresh cache)
            const request2 = createRequest();
            const response2 = await handler(request2);
            expect(response2.status).toBe(200);

            // File should be read twice due to cache expiration
            expect(readFileSyncSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('Error handling', () => {
        it('should handle file system errors gracefully', async () => {
            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockImplementation(() => {
                throw new Error('File not found');
            });

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

        it('should handle malformed JSON data', async () => {
            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(500);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('DATA_UNAVAILABLE');
        });

        it('should handle empty server data', async () => {
            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockReturnValue('[]');

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toMatchObject({
                success: true,
                statistics: {
                    totalServers: 0,
                    liveServers: 0,
                    newToday: 0,
                    latestFindMinutes: 0
                }
            });
        });

        it('should handle missing file gracefully', async () => {
            const fs = await import('fs');
            vi.mocked(fs.existsSync).mockReturnValue(false);

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(500);

            const data = await response.json();
            expect(data.success).toBe(false);
            expect(data.error).toBe('DATA_UNAVAILABLE');
        });
    });

    describe('Data edge cases', () => {
        it('should handle servers with missing timestamps', async () => {
            const malformedData = [
                {
                    id: '1',
                    ip: '192.168.1.100',
                    port: 8080,
                    version: '1.0.0',
                    status: 'online'
                    // Missing lastSeen and firstSeen
                },
                {
                    id: '2',
                    ip: '192.168.1.101',
                    port: 8080,
                    version: '1.0.1',
                    status: 'online',
                    lastSeen: '2024-03-15T14:25:00.000Z',
                    firstSeen: '2024-03-15T08:00:00.000Z'
                }
            ];

            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(malformedData));

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.statistics.totalServers).toBe(2);
            expect(data.statistics.liveServers).toBe(2);
        });

        it('should handle servers with invalid timestamps', async () => {
            const invalidData = [
                {
                    id: '1',
                    ip: '192.168.1.100',
                    port: 8080,
                    version: '1.0.0',
                    status: 'online',
                    lastSeen: 'invalid-date',
                    firstSeen: 'invalid-date'
                },
                {
                    id: '2',
                    ip: '192.168.1.101',
                    port: 8080,
                    version: '1.0.1',
                    status: 'online',
                    lastSeen: '2024-03-15T14:25:00.000Z',
                    firstSeen: '2024-03-15T08:00:00.000Z'
                }
            ];

            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(invalidData));

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.statistics.totalServers).toBe(2);
        });

        it('should handle servers with future timestamps', async () => {
            const futureData = [
                {
                    id: '1',
                    ip: '192.168.1.100',
                    port: 8080,
                    version: '1.0.0',
                    status: 'online',
                    lastSeen: '2024-03-16T14:30:00.000Z', // Future date
                    firstSeen: '2024-03-16T14:00:00.000Z'
                }
            ];

            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(futureData));

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.statistics.latestFindMinutes).toBeLessThan(0); // Negative for future dates
        });

        it('should handle different status values', async () => {
            const statusData = [
                { id: '1', status: 'online', lastSeen: '2024-03-15T14:30:00.000Z' },
                { id: '2', status: 'offline', lastSeen: '2024-03-15T14:25:00.000Z' },
                { id: '3', status: 'unknown', lastSeen: '2024-03-15T14:20:00.000Z' },
                { id: '4', status: 'maintenance', lastSeen: '2024-03-15T14:15:00.000Z' },
                { id: '5', status: '', lastSeen: '2024-03-15T14:10:00.000Z' }, // Empty status
                { id: '6', lastSeen: '2024-03-15T14:05:00.000Z' } // Missing status
            ];

            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(statusData));

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.statistics.totalServers).toBe(6);
            expect(data.statistics.liveServers).toBe(1); // Only 'online' status counts as live
        });
    });

    describe('HTTP methods', () => {
        it('should only accept GET requests', async () => {
            const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

            for (const method of methods) {
                const request = new NextRequest('https://example.com/api/stats', {
                    method
                });

                const response = await handler(request);
                expect(response.status).toBe(405); // Method Not Allowed
            }
        });

        it('should handle OPTIONS requests for CORS', async () => {
            const request = new NextRequest('https://example.com/api/stats', {
                method: 'OPTIONS'
            });

            const response = await handler(request);
            expect(response.status).toBe(200);
            expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
        });
    });

    describe('Response format', () => {
        it('should return consistent response format for success', async () => {
            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(200);
            expect(response.headers.get('Content-Type')).toContain('application/json');

            const data = await response.json();
            expect(data).toHaveProperty('success', true);
            expect(data).toHaveProperty('statistics');
            expect(data).toHaveProperty('lastUpdated');

            expect(data.statistics).toHaveProperty('totalServers');
            expect(data.statistics).toHaveProperty('liveServers');
            expect(data.statistics).toHaveProperty('newToday');
            expect(data.statistics).toHaveProperty('latestFindMinutes');

            expect(typeof data.statistics.totalServers).toBe('number');
            expect(typeof data.statistics.liveServers).toBe('number');
            expect(typeof data.statistics.newToday).toBe('number');
            expect(typeof data.statistics.latestFindMinutes).toBe('number');
            expect(typeof data.lastUpdated).toBe('string');
        });

        it('should return consistent response format for errors', async () => {
            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockImplementation(() => {
                throw new Error('File not found');
            });

            const request = createRequest();
            const response = await handler(request);

            expect(response.status).toBe(500);
            expect(response.headers.get('Content-Type')).toContain('application/json');

            const data = await response.json();
            expect(data).toHaveProperty('success', false);
            expect(data).toHaveProperty('error');
            expect(data).toHaveProperty('message');

            expect(typeof data.error).toBe('string');
            expect(typeof data.message).toBe('string');
        });
    });

    describe('Performance', () => {
        it('should handle large datasets efficiently', async () => {
            // Generate large dataset
            const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
                id: i.toString(),
                ip: `192.168.${Math.floor(i / 256)}.${i % 256}`,
                port: 8080,
                version: '1.0.0',
                status: i % 10 === 0 ? 'offline' : 'online',
                lastSeen: new Date(Date.now() - i * 1000).toISOString(),
                firstSeen: new Date(Date.now() - i * 10000).toISOString()
            }));

            const fs = await import('fs');
            vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(largeDataset));

            const startTime = Date.now();
            const request = createRequest();
            const response = await handler(request);
            const endTime = Date.now();

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.success).toBe(true);
            expect(data.statistics.totalServers).toBe(10000);
            expect(data.statistics.liveServers).toBe(9000); // 90% online

            // Should complete within reasonable time (adjust threshold as needed)
            expect(endTime - startTime).toBeLessThan(1000);
        });

        it('should handle concurrent requests efficiently', async () => {
            const requests = Array.from({ length: 10 }, () => createRequest());
            const startTime = Date.now();
            const responses = await Promise.all(requests.map(req => handler(req)));
            const endTime = Date.now();

            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            // Should complete within reasonable time
            expect(endTime - startTime).toBeLessThan(2000);
        });
    });

    describe('Timezone handling', () => {
        it('should calculate newToday based on UTC', async () => {
            // Set system time to different timezone scenarios
            const testCases = [
                { time: '2024-03-15T00:00:00.000Z', description: 'start of day UTC' },
                { time: '2024-03-15T12:00:00.000Z', description: 'middle of day UTC' },
                { time: '2024-03-15T23:59:59.999Z', description: 'end of day UTC' }
            ];

            for (const testCase of testCases) {
                vi.setSystemTime(new Date(testCase.time));

                const request = createRequest();
                const response = await handler(request);

                expect(response.status).toBe(200);

                const data = await response.json();
                expect(data.statistics.newToday).toBe(1); // Should consistently count servers from 2024-03-15
            }
        });
    });
});