// Vercel Edge Function for Vite projects
import { createUserIdentifierFromHeaders, isValidUserIdentifier, type UserIdentifier } from '../src/lib/user-identification';
import { processRequestWithRateLimit, getRateLimitHeaders, type RateLimitCheckResult } from '../src/lib/rate-limit';

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

// Interface for the raw server data from JSON file
interface RawServerData {
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
    ip: string;
}

/**
 * Load and parse the live servers JSON file
 * @returns Promise resolving to parsed server data
 */
async function loadServerData(): Promise<Record<string, RawServerData>> {
    try {
        // In Vercel Edge Functions, we need to fetch the file from the deployed URL
        // The file should be accessible at the root domain + path
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:5173'; // Fallback for local development

        const dataUrl = `${baseUrl}/data/live_servers.json`;

        console.log('Fetching server data from:', dataUrl);

        const response = await fetch(dataUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch server data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data || typeof data !== 'object') {
            throw new Error('Invalid server data format');
        }

        console.log(`Loaded ${Object.keys(data).length} servers from data file`);

        return data;
    } catch (error) {
        console.error('Error loading server data:', error);
        throw new Error('Failed to load server data');
    }
}

/**
 * Convert raw server data to the expected ServerData format
 * @param hash Server hash key
 * @param rawData Raw server data from JSON
 * @returns Formatted ServerData object
 */
function formatServerData(hash: string, rawData: RawServerData): ServerData {
    return {
        ip: rawData.ip,
        port: rawData.port,
        version: rawData.version,
        city: rawData.city,
        country: rawData.country,
        country_name: rawData.country_name,
        region: rawData.region,
        latitude: rawData.latitude,
        longitude: rawData.longitude,
        local: rawData.local || [],
        running: rawData.running || [],
        first_seen_online: rawData.first_seen_online,
        last_observed: rawData.last_observed,
        age: rawData.age,
        status: rawData.status
    };
}

/**
 * Get a random server from the live servers data
 * @returns Promise resolving to a random ServerData object
 */
async function getRandomServerData(): Promise<ServerData> {
    const serversData = await loadServerData();

    const serverHashes = Object.keys(serversData);

    if (serverHashes.length === 0) {
        throw new Error('No servers available');
    }

    // Select a random server
    const randomIndex = Math.floor(Math.random() * serverHashes.length);
    const selectedHash = serverHashes[randomIndex];
    const selectedRawData = serversData[selectedHash];

    if (!selectedRawData) {
        throw new Error('Selected server data is invalid');
    }

    return formatServerData(selectedHash, selectedRawData);
}

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