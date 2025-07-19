// Vercel Edge Function for Vite projects
import { createUserIdentifierFromHeaders, isValidUserIdentifier, type UserIdentifier } from '../src/lib/user-identification';
import { processRequestWithRateLimit, getRateLimitHeaders, type RateLimitCheckResult } from '../src/lib/rate-limit';
import { getRandomServerData } from '../src/lib/server-data-cache';

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
    try {
        // Only allow GET requests
        if (request.method !== 'GET') {
            const errorResponse: ErrorResponse = {
                success: false,
                error: 'METHOD_NOT_ALLOWED',
                message: 'Only GET requests are allowed',
            };

            return new Response(JSON.stringify(errorResponse), {
                status: 405,
                headers: {
                    'Allow': 'GET',
                    'Content-Type': 'application/json',
                }
            });
        }

        // Extract user identification from request headers
        let userIdentifier: UserIdentifier;
        try {
            userIdentifier = createUserIdentifierFromHeaders(request.headers);

            // Validate the user identifier
            if (!isValidUserIdentifier(userIdentifier)) {
                console.warn('Invalid user identifier generated:', userIdentifier);
                // Continue with a fallback identifier rather than failing
                userIdentifier = {
                    ip: '0.0.0.0',
                    fingerprint: null,
                    hash: 'fallback-hash'
                };
            }

            console.log('User identified:', {
                ip: userIdentifier.ip,
                hasFingerprint: !!userIdentifier.fingerprint,
                hash: userIdentifier.hash.substring(0, 8) + '...' // Log partial hash for debugging
            });

        } catch (identificationError) {
            console.error('User identification failed:', identificationError);

            // Fallback identification using basic IP extraction
            const fallbackIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                request.headers.get('x-real-ip') ||
                '0.0.0.0';

            userIdentifier = {
                ip: fallbackIP,
                fingerprint: null,
                hash: `fallback-${fallbackIP.replace(/\./g, '-')}`
            };

            console.log('Using fallback identification:', userIdentifier);
        }

        // Check and process rate limiting
        let rateLimitResult: RateLimitCheckResult;
        try {
            rateLimitResult = await processRequestWithRateLimit(userIdentifier.hash);

            console.log('Rate limit check result:', {
                allowed: rateLimitResult.allowed,
                dailyRemaining: rateLimitResult.rateLimitState.dailyRemaining,
                monthlyRemaining: rateLimitResult.rateLimitState.monthlyRemaining,
                isBlocked: rateLimitResult.rateLimitState.isBlocked,
                blockType: rateLimitResult.rateLimitState.blockType
            });

        } catch (rateLimitError) {
            console.error('Rate limiting failed:', rateLimitError);

            // Return error response when rate limiting fails
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
        try {
            serverData = await getRandomServerData();
        } catch (dataError) {
            console.error('Failed to load server data:', dataError);

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

        return new Response(JSON.stringify(successResponse), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                ...rateLimitHeaders
            }
        });

    } catch (error) {
        console.error('Edge Function error:', error);

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