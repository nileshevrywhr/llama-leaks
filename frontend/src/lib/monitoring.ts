/**
 * Monitoring and logging utilities for rate limiting and security
 * Provides structured logging, metrics collection, and alerting capabilities
 */

// Log levels
export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    CRITICAL = 'critical'
}

// Event types for monitoring
export enum EventType {
    RATE_LIMIT_VIOLATION = 'rate_limit_violation',
    RATE_LIMIT_WARNING = 'rate_limit_warning',
    SUSPICIOUS_ACTIVITY = 'suspicious_activity',
    SECURITY_VIOLATION = 'security_violation',
    KV_ERROR = 'kv_error',
    API_ERROR = 'api_error',
    USER_IDENTIFICATION_FAILURE = 'user_identification_failure',
    VALIDATION_FAILURE = 'validation_failure',
    BYPASS_ATTEMPT = 'bypass_attempt',
    PERFORMANCE_ISSUE = 'performance_issue'
}

// Structured log entry interface
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    eventType: EventType;
    message: string;
    userHash?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    requestId?: string;
    duration?: number;
    error?: {
        message: string;
        stack?: string;
        type?: string;
    };
}

// Metrics interface
export interface Metrics {
    rateLimitViolations: {
        daily: number;
        monthly: number;
        total: number;
    };
    suspiciousActivity: {
        invalidHeaders: number;
        bypassAttempts: number;
        botRequests: number;
    };
    performance: {
        averageResponseTime: number;
        kvOperationTime: number;
        errorRate: number;
    };
    lastUpdated: string;
}

// In-memory metrics storage (in production, this would be external)
let metricsData: Metrics = {
    rateLimitViolations: { daily: 0, monthly: 0, total: 0 },
    suspiciousActivity: { invalidHeaders: 0, bypassAttempts: 0, botRequests: 0 },
    performance: { averageResponseTime: 0, kvOperationTime: 0, errorRate: 0 },
    lastUpdated: new Date().toISOString()
};

// Performance tracking
const performanceMetrics = {
    requestTimes: [] as number[],
    kvOperationTimes: [] as number[],
    errorCount: 0,
    totalRequests: 0
};

/**
 * Create a structured log entry
 */
export function createLogEntry(
    level: LogLevel,
    eventType: EventType,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
): LogEntry {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        eventType,
        message,
        ...metadata,
        ...(error && {
            error: {
                message: error.message,
                stack: error.stack,
                type: error.constructor.name
            }
        })
    };

    return entry;
}

/**
 * Log a structured entry to console with appropriate formatting
 */
export function logEntry(entry: LogEntry): void {
    const logMessage = `[${entry.level.toUpperCase()}] [${entry.eventType}] ${entry.message}`;
    const logData = {
        ...entry,
        // Truncate sensitive data for logging
        userHash: entry.userHash ? entry.userHash.substring(0, 8) + '...' : undefined,
        userAgent: entry.userAgent ? entry.userAgent.substring(0, 100) + (entry.userAgent.length > 100 ? '...' : '') : undefined
    };

    switch (entry.level) {
        case LogLevel.DEBUG:
            console.debug(logMessage, logData);
            break;
        case LogLevel.INFO:
            console.info(logMessage, logData);
            break;
        case LogLevel.WARN:
            console.warn(logMessage, logData);
            break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
            console.error(logMessage, logData);
            break;
        default:
            console.log(logMessage, logData);
    }
}

/**
 * Log rate limit violation
 */
export function logRateLimitViolation(
    userHash: string,
    ip: string,
    violationType: 'daily' | 'monthly',
    currentCount: number,
    userAgent?: string
): void {
    const entry = createLogEntry(
        LogLevel.WARN,
        EventType.RATE_LIMIT_VIOLATION,
        `Rate limit exceeded: ${violationType} limit violated`,
        {
            userHash,
            ip,
            violationType,
            currentCount,
            userAgent,
            limit: violationType === 'daily' ? 3 : 15
        }
    );

    logEntry(entry);
    updateMetrics('rateLimitViolation', { type: violationType });
}

/**
 * Log rate limit warning (approaching limits)
 */
export function logRateLimitWarning(
    userHash: string,
    ip: string,
    warningType: 'daily' | 'monthly',
    currentCount: number,
    remaining: number,
    userAgent?: string
): void {
    const entry = createLogEntry(
        LogLevel.INFO,
        EventType.RATE_LIMIT_WARNING,
        `Rate limit warning: ${warningType} limit approaching`,
        {
            userHash,
            ip,
            warningType,
            currentCount,
            remaining,
            userAgent,
            limit: warningType === 'daily' ? 3 : 15
        }
    );

    logEntry(entry);
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
    activityType: 'invalid_headers' | 'bypass_attempt' | 'bot_request' | 'injection_attempt',
    details: Record<string, any>,
    ip?: string,
    userAgent?: string
): void {
    const entry = createLogEntry(
        LogLevel.WARN,
        EventType.SUSPICIOUS_ACTIVITY,
        `Suspicious activity detected: ${activityType}`,
        {
            activityType,
            ip,
            userAgent,
            ...details
        }
    );

    logEntry(entry);
    updateMetrics('suspiciousActivity', { type: activityType });
}

/**
 * Log security violation
 */
export function logSecurityViolation(
    violationType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    ip?: string,
    userAgent?: string
): void {
    const logLevel = severity === 'critical' ? LogLevel.CRITICAL :
        severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;

    const entry = createLogEntry(
        logLevel,
        EventType.SECURITY_VIOLATION,
        `Security violation: ${violationType}`,
        {
            violationType,
            severity,
            ip,
            userAgent,
            ...details
        }
    );

    logEntry(entry);
    updateMetrics('suspiciousActivity', { type: 'security_violation' });
}

/**
 * Log KV storage errors
 */
export function logKVError(
    operation: string,
    errorType: string,
    error: Error,
    retryable: boolean,
    userHash?: string
): void {
    const entry = createLogEntry(
        LogLevel.ERROR,
        EventType.KV_ERROR,
        `KV operation failed: ${operation}`,
        {
            operation,
            errorType,
            retryable,
            userHash
        },
        error
    );

    logEntry(entry);
    updateMetrics('performance', { type: 'error' });
}

/**
 * Log API errors
 */
export function logAPIError(
    endpoint: string,
    error: Error,
    statusCode: number,
    userHash?: string,
    ip?: string,
    duration?: number
): void {
    const entry = createLogEntry(
        LogLevel.ERROR,
        EventType.API_ERROR,
        `API error in ${endpoint}`,
        {
            endpoint,
            statusCode,
            userHash,
            ip,
            duration
        },
        error
    );

    logEntry(entry);
    updateMetrics('performance', { type: 'error' });
}

/**
 * Log user identification failures
 */
export function logUserIdentificationFailure(
    reason: string,
    fallbackUsed: boolean,
    ip?: string,
    userAgent?: string
): void {
    const entry = createLogEntry(
        LogLevel.WARN,
        EventType.USER_IDENTIFICATION_FAILURE,
        `User identification failed: ${reason}`,
        {
            reason,
            fallbackUsed,
            ip,
            userAgent
        }
    );

    logEntry(entry);
}

/**
 * Log validation failures
 */
export function logValidationFailure(
    validationType: string,
    field: string,
    reason: string,
    value?: string,
    ip?: string
): void {
    const entry = createLogEntry(
        LogLevel.WARN,
        EventType.VALIDATION_FAILURE,
        `Validation failed: ${validationType} for field ${field}`,
        {
            validationType,
            field,
            reason,
            value: value ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : undefined,
            ip
        }
    );

    logEntry(entry);
    updateMetrics('suspiciousActivity', { type: 'validation_failure' });
}

/**
 * Log performance metrics
 */
export function logPerformanceMetric(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, any>
): void {
    const entry = createLogEntry(
        LogLevel.DEBUG,
        EventType.PERFORMANCE_ISSUE,
        `Performance metric: ${operation} took ${duration}ms`,
        {
            operation,
            duration,
            success,
            ...metadata
        }
    );

    // Only log if duration is above threshold or operation failed
    if (duration > 1000 || !success) {
        logEntry(entry);
    }

    updateMetrics('performance', { operation, duration, success });
}

/**
 * Update internal metrics
 */
function updateMetrics(category: string, data: Record<string, any>): void {
    const now = new Date().toISOString();

    switch (category) {
        case 'rateLimitViolation':
            if (data.type === 'daily') {
                metricsData.rateLimitViolations.daily++;
            } else if (data.type === 'monthly') {
                metricsData.rateLimitViolations.monthly++;
            }
            metricsData.rateLimitViolations.total++;
            break;

        case 'suspiciousActivity':
            switch (data.type) {
                case 'invalid_headers':
                case 'validation_failure':
                    metricsData.suspiciousActivity.invalidHeaders++;
                    break;
                case 'bypass_attempt':
                case 'injection_attempt':
                    metricsData.suspiciousActivity.bypassAttempts++;
                    break;
                case 'bot_request':
                    metricsData.suspiciousActivity.botRequests++;
                    break;
            }
            break;

        case 'performance':
            if (data.type === 'error') {
                performanceMetrics.errorCount++;
            } else if (data.operation && data.duration !== undefined) {
                performanceMetrics.totalRequests++;

                if (data.operation.includes('kv') || data.operation.includes('KV')) {
                    performanceMetrics.kvOperationTimes.push(data.duration);
                } else {
                    performanceMetrics.requestTimes.push(data.duration);
                }

                // Keep only last 100 measurements
                if (performanceMetrics.requestTimes.length > 100) {
                    performanceMetrics.requestTimes = performanceMetrics.requestTimes.slice(-100);
                }
                if (performanceMetrics.kvOperationTimes.length > 100) {
                    performanceMetrics.kvOperationTimes = performanceMetrics.kvOperationTimes.slice(-100);
                }

                // Update averages
                if (performanceMetrics.requestTimes.length > 0) {
                    metricsData.performance.averageResponseTime =
                        performanceMetrics.requestTimes.reduce((a, b) => a + b, 0) / performanceMetrics.requestTimes.length;
                }

                if (performanceMetrics.kvOperationTimes.length > 0) {
                    metricsData.performance.kvOperationTime =
                        performanceMetrics.kvOperationTimes.reduce((a, b) => a + b, 0) / performanceMetrics.kvOperationTimes.length;
                }

                // Update error rate
                metricsData.performance.errorRate =
                    performanceMetrics.totalRequests > 0 ?
                        (performanceMetrics.errorCount / performanceMetrics.totalRequests) * 100 : 0;
            }
            break;
    }

    metricsData.lastUpdated = now;
}

/**
 * Get current metrics
 */
export function getMetrics(): Metrics {
    return { ...metricsData };
}

/**
 * Reset metrics (for testing or periodic reset)
 */
export function resetMetrics(): void {
    metricsData = {
        rateLimitViolations: { daily: 0, monthly: 0, total: 0 },
        suspiciousActivity: { invalidHeaders: 0, bypassAttempts: 0, botRequests: 0 },
        performance: { averageResponseTime: 0, kvOperationTime: 0, errorRate: 0 },
        lastUpdated: new Date().toISOString()
    };

    performanceMetrics.requestTimes = [];
    performanceMetrics.kvOperationTimes = [];
    performanceMetrics.errorCount = 0;
    performanceMetrics.totalRequests = 0;
}

/**
 * Check if metrics indicate potential issues that need alerting
 */
export function checkForAlerts(): {
    alerts: Array<{
        type: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        value: number;
        threshold: number;
    }>;
    healthy: boolean;
} {
    const alerts = [];

    // Check error rate
    if (metricsData.performance.errorRate > 10) {
        alerts.push({
            type: 'high_error_rate',
            severity: metricsData.performance.errorRate > 25 ? 'critical' : 'high',
            message: `Error rate is ${metricsData.performance.errorRate.toFixed(2)}%`,
            value: metricsData.performance.errorRate,
            threshold: 10
        });
    }

    // Check response time
    if (metricsData.performance.averageResponseTime > 2000) {
        alerts.push({
            type: 'slow_response_time',
            severity: metricsData.performance.averageResponseTime > 5000 ? 'high' : 'medium',
            message: `Average response time is ${metricsData.performance.averageResponseTime.toFixed(0)}ms`,
            value: metricsData.performance.averageResponseTime,
            threshold: 2000
        });
    }

    // Check KV operation time
    if (metricsData.performance.kvOperationTime > 1000) {
        alerts.push({
            type: 'slow_kv_operations',
            severity: metricsData.performance.kvOperationTime > 3000 ? 'high' : 'medium',
            message: `KV operations averaging ${metricsData.performance.kvOperationTime.toFixed(0)}ms`,
            value: metricsData.performance.kvOperationTime,
            threshold: 1000
        });
    }

    // Check suspicious activity
    if (metricsData.suspiciousActivity.bypassAttempts > 10) {
        alerts.push({
            type: 'bypass_attempts',
            severity: metricsData.suspiciousActivity.bypassAttempts > 50 ? 'critical' : 'high',
            message: `${metricsData.suspiciousActivity.bypassAttempts} bypass attempts detected`,
            value: metricsData.suspiciousActivity.bypassAttempts,
            threshold: 10
        });
    }

    // Check rate limit violations
    if (metricsData.rateLimitViolations.total > 100) {
        alerts.push({
            type: 'high_rate_limit_violations',
            severity: metricsData.rateLimitViolations.total > 500 ? 'high' : 'medium',
            message: `${metricsData.rateLimitViolations.total} rate limit violations`,
            value: metricsData.rateLimitViolations.total,
            threshold: 100
        });
    }

    const healthy = alerts.length === 0 || alerts.every(alert => alert.severity === 'low');

    return { alerts, healthy };
}

/**
 * Generate a monitoring report
 */
export function generateMonitoringReport(): {
    timestamp: string;
    metrics: Metrics;
    alerts: ReturnType<typeof checkForAlerts>;
    summary: {
        totalRequests: number;
        errorCount: number;
        healthStatus: 'healthy' | 'warning' | 'critical';
    };
} {
    const alerts = checkForAlerts();
    const healthStatus = alerts.healthy ? 'healthy' :
        alerts.alerts.some(a => a.severity === 'critical') ? 'critical' : 'warning';

    return {
        timestamp: new Date().toISOString(),
        metrics: getMetrics(),
        alerts,
        summary: {
            totalRequests: performanceMetrics.totalRequests,
            errorCount: performanceMetrics.errorCount,
            healthStatus
        }
    };
}

/**
 * Performance timing utility
 */
export class PerformanceTimer {
    private startTime: number;
    private operation: string;

    constructor(operation: string) {
        this.operation = operation;
        this.startTime = Date.now();
    }

    end(success: boolean = true, metadata?: Record<string, any>): number {
        const duration = Date.now() - this.startTime;
        logPerformanceMetric(this.operation, duration, success, metadata);
        return duration;
    }
}

/**
 * Create a performance timer
 */
export function createTimer(operation: string): PerformanceTimer {
    return new PerformanceTimer(operation);
}