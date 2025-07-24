// Vercel Edge Function for Vite projects
import { createUserIdentifierFromHeaders, isValidUserIdentifier, type UserIdentifier } from '../src/lib/user-identification';
import { processRequestWithRateLimit, getRateLimitHeaders, type RateLimitCheckResult } from '../src/lib/rate-limit';
import { getRandomServerData } from '../src/lib/server-data-cache';
import { validateAndSanitizeIP } from '../src/lib/input-validation';
import {
    createTimer,
    logAPIError,
    logUserIdentificationFailure,
    logSuspiciousActivity,
    logRateLimitViolation,
    generateMonitoringReport
} from '../src/lib/monitoring';

// Response interfaces based on design document
interface ServerData {
    ip: string;
    port: number;
    version: string;
    city: string;
    country: string;
    country_name: string;
    region: string;
    latitude: string;
    longitude: string;
    local: Array<{
        name: string;
        model: string;
        size: number;
    }>;
    running: Array<{
        name: string;
        model: string;
        size: number;
    }>;
    first_seen_online: string;
    last_observed: string;
    age: string;
    status: string;
}

interface RateLimitInfo {
    dailyRemaining: number;
    monthlyRemaining: number;
    dailyResetTime: string;
    monthlyResetTime: string;
}

interface SuccessResponse {
    success: true;
    data: ServerData;
    rateLimit: RateLimitInfo;
}

interface ErrorResponse {
    success: false;
    error: string;
    message: string;
    rateLimit?: RateLimitInfo;
    retryAfter?: number;
}

export const config = {
    runtime: 'edge',
};

// Note: Server data loading and caching is now handled by the shared cache layer

export default async function handler(request: Request): Promise<Response> {
    const requestTimer = createTimer('api-random-request');
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    try {
        console.log('[API] Processing /api/random request', {
            requestId,
            method: request.method,
            timestamp: new Date().toISOString()
        });

        // Only allow GET requests
        if (request.method !== 'GET') {
            logSuspiciousActivity(
                'invalid_headers',
                {
                    reason: 'Invalid HTTP method',
                    method: request.method,
                    requestId
                },
                request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
                request.headers.get('user-agent') || undefined
            );

            const errorResponse: ErrorResponse = {
                success: false,
                error: 'METHOD_NOT_ALLOWED',
                message: 'Only GET requests are allowed',
            };

            requestTimer.end(false);
            return new Response(JSON.stringify(errorResponse), {
                status: 405,
                headers: {
                    'Allow': 'GET',
                    'Content-Type': 'application/json',
                }
            });
        }

        // Extract user identification from request headers with enhanced validation
        let userIdentifier: UserIdentifier;
        try {
            console.log('[API] Starting user identification process', {
                timestamp: new Date().toISOString()
            });

            userIdentifier = createUserIdentifierFromHeaders(request.headers);

            // Validate the user identifier
            if (!isValidUserIdentifier(userIdentifier)) {
                console.warn('[API] Invalid user identifier generated, using secure fallback', {
                    ip: userIdentifier.ip,
                    hasFingerprint: !!userIdentifier.fingerprint,
                    hashLength: userIdentifier.hash?.length || 0,
                    timestamp: new Date().toISOString()
                });

                // Use a more secure fallback identifier
                const fallbackIP = userIdentifier.ip !== '0.0.0.0' ? userIdentifier.ip : '127.0.0.1';
                userIdentifier = {
                    ip: fallbackIP,
                    fingerprint: null,
                    hash: `secure-fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`
                };
            }

            console.log('[API] User identification successful', {
                ip: userIdentifier.ip,
                hasFingerprint: !!userIdentifier.fingerprint,
                hashPrefix: userIdentifier.hash.substring(0, 8) + '...',
                timestamp: new Date().toISOString()
            });

        } catch (identificationError) {
            const fallbackIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                request.headers.get('x-real-ip') ||
                request.headers.get('x-client-ip') ||
                '127.0.0.1';

            // Log user identification failure for monitoring
            logUserIdentificationFailure(
                identificationError.message,
                true,
                fallbackIP,
                request.headers.get('user-agent') || undefined
            );

            console.error('[API] User identification failed with error', {
                error: identificationError.message,
                requestId,
                timestamp: new Date().toISOString()
            });

            // Validate the fallback IP
            const validatedFallbackIP = validateAndSanitizeIP(fallbackIP) || '127.0.0.1';

            userIdentifier = {
                ip: validatedFallbackIP,
                fingerprint: null,
                hash: `error-fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`
            };

            console.log('[API] Using enhanced fallback identification', {
                ip: userIdentifier.ip,
                hashPrefix: userIdentifier.hash.substring(0, 8) + '...',
                requestId,
                timestamp: new Date().toISOString()
            });
        }

        // Check and process rate limiting
        let rateLimitResult: RateLimitCheckResult;
        const rateLimitTimer = createTimer('rate-limit-check');

        try {
            rateLimitResult = await processRequestWithRateLimit(userIdentifier.hash);
            rateLimitTimer.end(true);

            console.log('[API] Rate limit check result:', {
                allowed: rateLimitResult.allowed,
                dailyRemaining: rateLimitResult.rateLimitState.dailyRemaining,
                monthlyRemaining: rateLimitResult.rateLimitState.monthlyRemaining,
                isBlocked: rateLimitResult.rateLimitState.isBlocked,
                blockType: rateLimitResult.rateLimitState.blockType,
                requestId,
                timestamp: new Date().toISOString()
            });

        } catch (rateLimitError) {
            rateLimitTimer.end(false);

            // Log API error for monitoring
            logAPIError(
                '/api/random',
                rateLimitError,
                503,
                userIdentifier.hash,
                userIdentifier.ip,
                requestTimer.end(false)
            );

            console.error('[API] Rate limiting failed:', {
                error: rateLimitError.message,
                requestId,
                timestamp: new Date().toISOString()
            });

            const errorResponse: ErrorResponse = {
                success: false,
                error: 'RATE_LIMIT_ERROR',
                message: 'Rate limiting service is temporarily unavailable',
            };

            return new Response(JSON.stringify(errorResponse), {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '60', // Retry after 1 minute
                }
            });
        }

        // Check if request is blocked by rate limits
        if (!rateLimitResult.allowed) {
            // Log rate limit violation with full context for monitoring
            logRateLimitViolation(
                userIdentifier.hash,
                userIdentifier.ip,
                rateLimitResult.rateLimitState.blockType!,
                rateLimitResult.rateLimitState.blockType === 'daily' ?
                    rateLimitResult.rateLimitState.dailyCount :
                    rateLimitResult.rateLimitState.monthlyCount,
                request.headers.get('user-agent') || undefined
            );

            const rateLimitInfo: RateLimitInfo = {
                dailyRemaining: rateLimitResult.rateLimitState.dailyRemaining,
                monthlyRemaining: rateLimitResult.rateLimitState.monthlyRemaining,
                dailyResetTime: rateLimitResult.rateLimitState.dailyResetTime.toISOString(),
                monthlyResetTime: rateLimitResult.rateLimitState.monthlyResetTime.toISOString(),
            };

            const errorResponse: ErrorResponse = {
                success: false,
                error: 'RATE_LIMIT_EXCEEDED',
                message: rateLimitResult.errorMessage || 'Rate limit exceeded',
                rateLimit: rateLimitInfo,
                retryAfter: rateLimitResult.retryAfter
            };

            const rateLimitHeaders = getRateLimitHeaders(rateLimitResult.rateLimitState);

            console.log('[API] Request blocked by rate limit', {
                userHash: userIdentifier.hash.substring(0, 8) + '...',
                ip: userIdentifier.ip,
                blockType: rateLimitResult.rateLimitState.blockType,
                requestId,
                timestamp: new Date().toISOString()
            });

            requestTimer.end(false);
            return new Response(JSON.stringify(errorResponse), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    ...rateLimitHeaders
                }
            });
        }

        // Request is allowed, prepare rate limit info for successful response
        const rateLimitInfo: RateLimitInfo = {
            dailyRemaining: rateLimitResult.rateLimitState.dailyRemaining,
            monthlyRemaining: rateLimitResult.rateLimitState.monthlyRemaining,
            dailyResetTime: rateLimitResult.rateLimitState.dailyResetTime.toISOString(),
            monthlyResetTime: rateLimitResult.rateLimitState.monthlyResetTime.toISOString(),
        };

        // Load and serve actual server data
        let serverData: ServerData;
        const dataTimer = createTimer('server-data-fetch');

        try {
            serverData = await getRandomServerData();
            dataTimer.end(true);

            console.log('[API] Server data loaded successfully', {
                requestId,
                timestamp: new Date().toISOString()
            });
        } catch (dataError) {
            dataTimer.end(false);

            // Log API error for monitoring
            logAPIError(
                '/api/random',
                dataError,
                503,
                userIdentifier.hash,
                userIdentifier.ip,
                requestTimer.end(false)
            );

            console.error('[API] Failed to load server data:', {
                error: dataError.message,
                requestId,
                timestamp: new Date().toISOString()
            });

            const errorResponse: ErrorResponse = {
                success: false,
                error: 'DATA_UNAVAILABLE',
                message: 'Server data is temporarily unavailable',
                rateLimit: rateLimitInfo
            };

            const rateLimitHeaders = getRateLimitHeaders(rateLimitResult.rateLimitState);

            return new Response(JSON.stringify(errorResponse), {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '30', // Retry after 30 seconds
                    ...rateLimitHeaders
                }
            });
        }

        const successResponse: SuccessResponse = {
            success: true,
            data: serverData,
            rateLimit: rateLimitInfo,
        };

        const rateLimitHeaders = getRateLimitHeaders(rateLimitResult.rateLimitState);

        // Log successful request completion
        const requestDuration = requestTimer.end(true);
        console.log('[API] Request completed successfully', {
            requestId,
            duration: requestDuration,
            userHash: userIdentifier.hash.substring(0, 8) + '...',
            ip: userIdentifier.ip,
            dailyRemaining: rateLimitResult.rateLimitState.dailyRemaining,
            monthlyRemaining: rateLimitResult.rateLimitState.monthlyRemaining,
            timestamp: new Date().toISOString()
        });

        return new Response(JSON.stringify(successResponse), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                ...rateLimitHeaders
            }
        });

    } catch (error) {
        // Log critical API error for monitoring
        logAPIError(
            '/api/random',
            error,
            500,
            undefined, // userHash may not be available
            request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
            requestTimer.end(false)
        );

        console.error('[API] Critical Edge Function error:', {
            error: error.message,
            stack: error.stack,
            requestId,
            timestamp: new Date().toISOString()
        });

        const errorResponse: ErrorResponse = {
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
}