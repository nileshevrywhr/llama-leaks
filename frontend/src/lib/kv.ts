import { kv } from '@vercel/kv';

// KV connection configuration
// In Edge Functions, we need to ensure the client is properly initialized
export const kvClient = kv;

// KV error types for better error handling
export enum KVErrorType {
    CONNECTION_FAILED = 'CONNECTION_FAILED',
    TIMEOUT = 'TIMEOUT',
    AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    INVALID_OPERATION = 'INVALID_OPERATION',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface KVError extends Error {
    type: KVErrorType;
    originalError?: Error;
    retryable: boolean;
}

// Create a structured KV error
export function createKVError(message: string, type: KVErrorType, originalError?: Error, retryable: boolean = false): KVError {
    const error = new Error(message) as KVError;
    error.type = type;
    error.originalError = originalError;
    error.retryable = retryable;
    return error;
}

// Classify KV errors based on error messages and types
export function classifyKVError(error: any): KVError {
    const errorMessage = error?.message || error?.toString() || 'Unknown KV error';

    // Connection-related errors
    if (errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ENOTFOUND') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('network') ||
        errorMessage.includes('connection')) {
        return createKVError(
            `KV connection failed: ${errorMessage}`,
            KVErrorType.CONNECTION_FAILED,
            error,
            true // Connection errors are retryable
        );
    }

    // Timeout errors
    if (errorMessage.includes('timeout') ||
        errorMessage.includes('ETIMEDOUT') ||
        error?.code === 'ETIMEDOUT') {
        return createKVError(
            `KV operation timed out: ${errorMessage}`,
            KVErrorType.TIMEOUT,
            error,
            true // Timeout errors are retryable
        );
    }

    // Authentication errors
    if (errorMessage.includes('unauthorized') ||
        errorMessage.includes('authentication') ||
        errorMessage.includes('invalid token') ||
        error?.status === 401 ||
        error?.status === 403) {
        return createKVError(
            `KV authentication failed: ${errorMessage}`,
            KVErrorType.AUTHENTICATION_FAILED,
            error,
            false // Auth errors are not retryable
        );
    }

    // Rate limiting errors (from KV service itself)
    if (errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        error?.status === 429) {
        return createKVError(
            `KV rate limit exceeded: ${errorMessage}`,
            KVErrorType.RATE_LIMIT_EXCEEDED,
            error,
            true // Rate limit errors are retryable after delay
        );
    }

    // Invalid operation errors
    if (errorMessage.includes('invalid') ||
        errorMessage.includes('bad request') ||
        error?.status === 400) {
        return createKVError(
            `Invalid KV operation: ${errorMessage}`,
            KVErrorType.INVALID_OPERATION,
            error,
            false // Invalid operations are not retryable
        );
    }

    // Default to unknown error
    return createKVError(
        `Unknown KV error: ${errorMessage}`,
        KVErrorType.UNKNOWN_ERROR,
        error,
        false // Unknown errors are not retryable by default
    );
}

// Enhanced environment validation with detailed logging
export function validateKVEnvironment(): boolean {
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    if (!kvUrl || !kvToken) {
        console.warn('[KV] Environment variables not configured. Rate limiting will be disabled.', {
            hasUrl: !!kvUrl,
            hasToken: !!kvToken,
            timestamp: new Date().toISOString()
        });
        return false;
    }

    if (kvUrl.includes('your-kv-database-url') || kvToken.includes('your-kv-rest-api-token')) {
        console.warn('[KV] Environment variables contain placeholder values. Rate limiting will be disabled.', {
            urlIsPlaceholder: kvUrl.includes('your-kv-database-url'),
            tokenIsPlaceholder: kvToken.includes('your-kv-rest-api-token'),
            timestamp: new Date().toISOString()
        });
        return false;
    }

    return true;
}

// Enhanced KV operation wrapper with error handling and retries
export async function safeKVOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 2,
    retryDelay: number = 1000
): Promise<T | null> {
    let lastError: KVError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const result = await operation();

            // Log successful operation if it was retried
            if (attempt > 0) {
                console.log(`[KV] Operation '${operationName}' succeeded on attempt ${attempt + 1}`, {
                    timestamp: new Date().toISOString()
                });
            }

            return result;
        } catch (error) {
            const kvError = classifyKVError(error);
            lastError = kvError;

            console.error(`[KV] Operation '${operationName}' failed on attempt ${attempt + 1}`, {
                error: kvError.message,
                type: kvError.type,
                retryable: kvError.retryable,
                attempt: attempt + 1,
                maxRetries: maxRetries + 1,
                timestamp: new Date().toISOString()
            });

            // Don't retry if error is not retryable or we've exhausted retries
            if (!kvError.retryable || attempt >= maxRetries) {
                break;
            }

            // Wait before retrying (exponential backoff)
            const delay = retryDelay * Math.pow(2, attempt);
            console.log(`[KV] Retrying operation '${operationName}' in ${delay}ms`, {
                timestamp: new Date().toISOString()
            });

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // All retries failed
    console.error(`[KV] Operation '${operationName}' failed after ${maxRetries + 1} attempts`, {
        finalError: lastError?.message,
        errorType: lastError?.type,
        timestamp: new Date().toISOString()
    });

    return null;
}

// Enhanced KV connection test with detailed error reporting
export async function testKVConnection(): Promise<boolean> {
    try {
        if (!validateKVEnvironment()) {
            return false;
        }

        console.log('[KV] Testing connection...', {
            timestamp: new Date().toISOString()
        });

        // Test connection with a simple ping using safe operation wrapper
        const testKey = `test:connection:${Date.now()}`;
        const testValue = 'ok';

        const setResult = await safeKVOperation(
            () => kvClient.set(testKey, testValue, { ex: 10 }),
            'connection-test-set'
        );

        if (setResult === null) {
            console.error('[KV] Connection test failed: Unable to set test key', {
                timestamp: new Date().toISOString()
            });
            return false;
        }

        const getResult = await safeKVOperation(
            () => kvClient.get(testKey),
            'connection-test-get'
        );

        if (getResult !== testValue) {
            console.error('[KV] Connection test failed: Retrieved value does not match', {
                expected: testValue,
                actual: getResult,
                timestamp: new Date().toISOString()
            });
            return false;
        }

        // Clean up test key
        await safeKVOperation(
            () => kvClient.del(testKey),
            'connection-test-cleanup'
        );

        console.log('[KV] Connection test successful', {
            timestamp: new Date().toISOString()
        });

        return true;
    } catch (error) {
        const kvError = classifyKVError(error);
        console.error('[KV] Connection test failed with unexpected error', {
            error: kvError.message,
            type: kvError.type,
            timestamp: new Date().toISOString()
        });
        return false;
    }
}

// Health check function for monitoring
export async function getKVHealthStatus(): Promise<{
    healthy: boolean;
    environmentValid: boolean;
    connectionWorking: boolean;
    lastChecked: string;
    error?: string;
}> {
    const lastChecked = new Date().toISOString();
    const environmentValid = validateKVEnvironment();

    if (!environmentValid) {
        return {
            healthy: false,
            environmentValid: false,
            connectionWorking: false,
            lastChecked,
            error: 'KV environment not properly configured'
        };
    }

    const connectionWorking = await testKVConnection();

    return {
        healthy: connectionWorking,
        environmentValid,
        connectionWorking,
        lastChecked,
        ...(connectionWorking ? {} : { error: 'KV connection test failed' })
    };
}