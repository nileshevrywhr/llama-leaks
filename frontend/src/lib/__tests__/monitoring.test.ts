/**
 * Tests for monitoring and logging utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    LogLevel,
    EventType,
    createLogEntry,
    logRateLimitViolation,
    logSuspiciousActivity,
    logKVError,
    getMetrics,
    resetMetrics,
    checkForAlerts,
    createTimer,
    generateMonitoringReport
} from '../monitoring';

// Mock console methods
const consoleSpy = {
    debug: vi.spyOn(console, 'debug').mockImplementation(() => { }),
    info: vi.spyOn(console, 'info').mockImplementation(() => { }),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
    error: vi.spyOn(console, 'error').mockImplementation(() => { }),
    log: vi.spyOn(console, 'log').mockImplementation(() => { })
};

describe('Monitoring System', () => {
    beforeEach(() => {
        // Reset metrics before each test
        resetMetrics();

        // Clear console spy calls
        Object.values(consoleSpy).forEach(spy => spy.mockClear());
    });

    describe('createLogEntry', () => {
        it('should create a structured log entry', () => {
            const entry = createLogEntry(
                LogLevel.INFO,
                EventType.RATE_LIMIT_WARNING,
                'Test message',
                { userHash: 'test-hash', ip: '127.0.0.1' }
            );

            expect(entry).toMatchObject({
                level: LogLevel.INFO,
                eventType: EventType.RATE_LIMIT_WARNING,
                message: 'Test message',
                userHash: 'test-hash',
                ip: '127.0.0.1'
            });
            expect(entry.timestamp).toBeDefined();
        });

        it('should include error information when provided', () => {
            const testError = new Error('Test error');
            const entry = createLogEntry(
                LogLevel.ERROR,
                EventType.KV_ERROR,
                'Error occurred',
                {},
                testError
            );

            expect(entry.error).toMatchObject({
                message: 'Test error',
                type: 'Error'
            });
            expect(entry.error?.stack).toBeDefined();
        });
    });

    describe('logRateLimitViolation', () => {
        it('should log rate limit violation and update metrics', () => {
            logRateLimitViolation('test-hash', '127.0.0.1', 'daily', 4);

            // Check that console.warn was called
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[WARN] [rate_limit_violation]'),
                expect.objectContaining({
                    userHash: 'test-has...',
                    ip: '127.0.0.1',
                    violationType: 'daily',
                    currentCount: 4
                })
            );

            // Check that metrics were updated
            const metrics = getMetrics();
            expect(metrics.rateLimitViolations.daily).toBe(1);
            expect(metrics.rateLimitViolations.total).toBe(1);
        });

        it('should handle monthly violations', () => {
            logRateLimitViolation('test-hash', '127.0.0.1', 'monthly', 16);

            const metrics = getMetrics();
            expect(metrics.rateLimitViolations.monthly).toBe(1);
            expect(metrics.rateLimitViolations.total).toBe(1);
        });
    });

    describe('logSuspiciousActivity', () => {
        it('should log suspicious activity and update metrics', () => {
            logSuspiciousActivity(
                'invalid_headers',
                { reason: 'Missing User-Agent' },
                '127.0.0.1',
                'TestBot/1.0'
            );

            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[WARN] [suspicious_activity]'),
                expect.objectContaining({
                    activityType: 'invalid_headers',
                    ip: '127.0.0.1',
                    userAgent: 'TestBot/1.0'
                })
            );

            const metrics = getMetrics();
            expect(metrics.suspiciousActivity.invalidHeaders).toBe(1);
        });

        it('should handle bypass attempts', () => {
            logSuspiciousActivity(
                'bypass_attempt',
                { method: 'header_manipulation' },
                '192.168.1.1'
            );

            const metrics = getMetrics();
            expect(metrics.suspiciousActivity.bypassAttempts).toBe(1);
        });
    });

    describe('logKVError', () => {
        it('should log KV errors and update performance metrics', () => {
            const testError = new Error('Connection failed');

            logKVError('get-counter', 'CONNECTION_FAILED', testError, true, 'test-hash');

            expect(consoleSpy.error).toHaveBeenCalledWith(
                expect.stringContaining('[ERROR] [kv_error]'),
                expect.objectContaining({
                    operation: 'get-counter',
                    errorType: 'CONNECTION_FAILED',
                    retryable: true,
                    userHash: 'test-has...'
                })
            );

            const metrics = getMetrics();
            expect(metrics.performance.errorRate).toBeGreaterThan(0);
        });
    });

    describe('Performance Timer', () => {
        it('should measure operation duration', async () => {
            const timer = createTimer('test-operation');

            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 10));

            const duration = timer.end(true);

            expect(duration).toBeGreaterThan(0);
            expect(consoleSpy.debug).toHaveBeenCalledWith(
                expect.stringContaining('Performance metric: test-operation'),
                expect.objectContaining({
                    operation: 'test-operation',
                    success: true
                })
            );
        });

        it('should handle failed operations', () => {
            const timer = createTimer('failed-operation');
            const duration = timer.end(false);

            expect(duration).toBeGreaterThanOrEqual(0);

            const metrics = getMetrics();
            expect(metrics.performance.errorRate).toBeGreaterThan(0);
        });
    });

    describe('Metrics and Alerts', () => {
        it('should track metrics correctly', () => {
            // Generate some test data
            logRateLimitViolation('hash1', '127.0.0.1', 'daily', 4);
            logRateLimitViolation('hash2', '127.0.0.1', 'monthly', 16);
            logSuspiciousActivity('bot_request', {}, '192.168.1.1');

            const metrics = getMetrics();
            expect(metrics.rateLimitViolations.daily).toBe(1);
            expect(metrics.rateLimitViolations.monthly).toBe(1);
            expect(metrics.rateLimitViolations.total).toBe(2);
            expect(metrics.suspiciousActivity.botRequests).toBe(1);
        });

        it('should generate alerts for high error rates', () => {
            // Simulate high error rate
            for (let i = 0; i < 20; i++) {
                const timer = createTimer('test-op');
                timer.end(false); // Failed operations
            }

            const { alerts, healthy } = checkForAlerts();
            expect(healthy).toBe(false);
            expect(alerts).toContainEqual(
                expect.objectContaining({
                    type: 'high_error_rate',
                    severity: expect.any(String)
                })
            );
        });

        it('should generate monitoring report', () => {
            logRateLimitViolation('test-hash', '127.0.0.1', 'daily', 4);

            const report = generateMonitoringReport();

            expect(report).toMatchObject({
                timestamp: expect.any(String),
                metrics: expect.objectContaining({
                    rateLimitViolations: expect.objectContaining({
                        daily: 1,
                        total: 1
                    })
                }),
                alerts: expect.objectContaining({
                    healthy: expect.any(Boolean),
                    alerts: expect.any(Array)
                }),
                summary: expect.objectContaining({
                    totalRequests: expect.any(Number),
                    errorCount: expect.any(Number),
                    healthStatus: expect.any(String)
                })
            });
        });
    });

    describe('resetMetrics', () => {
        it('should reset all metrics to initial state', () => {
            // Generate some data
            logRateLimitViolation('test-hash', '127.0.0.1', 'daily', 4);
            logSuspiciousActivity('bot_request', {}, '192.168.1.1');

            let metrics = getMetrics();
            expect(metrics.rateLimitViolations.total).toBe(1);
            expect(metrics.suspiciousActivity.botRequests).toBe(1);

            // Reset metrics
            resetMetrics();

            metrics = getMetrics();
            expect(metrics.rateLimitViolations.total).toBe(0);
            expect(metrics.suspiciousActivity.botRequests).toBe(0);
            expect(metrics.performance.errorRate).toBe(0);
        });
    });
});