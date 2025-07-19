// Vercel Edge Function for server statistics
import { getServerStatistics } from '../src/lib/server-data-cache';

// Response interfaces
interface StatisticsData {
    totalServers: number;
    liveServers: number;
    newToday: number;
    latestFindMinutes: number;
}

interface SuccessResponse {
    success: true;
    statistics: StatisticsData;
    lastUpdated: string;
}

interface ErrorResponse {
    success: false;
    error: string;
    message: string;
}

export const config = {
    runtime: 'edge',
};

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

        // Get aggregate statistics using shared cache
        let statistics: StatisticsData;
        try {
            statistics = await getServerStatistics();
        } catch (statisticsError) {
            console.error('Failed to calculate server statistics:', statisticsError);

            const errorResponse: ErrorResponse = {
                success: false,
                error: 'DATA_UNAVAILABLE',
                message: 'Server statistics are temporarily unavailable',
            };

            return new Response(JSON.stringify(errorResponse), {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': '30', // Retry after 30 seconds
                }
            });
        }

        const successResponse: SuccessResponse = {
            success: true,
            statistics,
            lastUpdated: new Date().toISOString(),
        };

        return new Response(JSON.stringify(successResponse), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
            }
        });

    } catch (error) {
        console.error('Stats Edge Function error:', error);

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