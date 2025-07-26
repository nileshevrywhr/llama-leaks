// Debug endpoint to test data loading
import { getCachedServerData, getCacheStatus } from '../src/lib/server-data-cache';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
    try {
        const requestUrl = new URL(request.url);
        const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

        console.log('Debug endpoint called with baseUrl:', baseUrl);
        console.log('Environment variables:', {
            VERCEL_URL: process.env.VERCEL_URL,
            NODE_ENV: process.env.NODE_ENV
        });

        // Get cache status
        const cacheStatus = getCacheStatus();
        console.log('Cache status:', cacheStatus);

        // Try to load data
        let dataResult;
        let error = null;

        try {
            const servers = await getCachedServerData(baseUrl);
            dataResult = {
                success: true,
                serverCount: servers.length,
                sampleServer: servers[0] ? {
                    ip: servers[0].ip,
                    city: servers[0].city,
                    country: servers[0].country
                } : null
            };
        } catch (loadError) {
            error = loadError.message;
            dataResult = {
                success: false,
                error: error
            };
        }

        const debugInfo = {
            timestamp: new Date().toISOString(),
            requestUrl: request.url,
            baseUrl,
            environment: {
                VERCEL_URL: process.env.VERCEL_URL,
                NODE_ENV: process.env.NODE_ENV
            },
            cacheStatus,
            dataResult,
            attemptedUrls: [
                `${baseUrl}/data/live_servers.json`,
                '/data/live_servers.json',
                ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}/data/live_servers.json`] : []),
                ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173/data/live_servers.json'] : []),
                'https://llama-leaks.vercel.app/data/live_servers.json',
                'https://llama-leaks.onrender.com/data/live_servers.json'
            ]
        };

        return new Response(JSON.stringify(debugInfo, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            }
        });

    } catch (error) {
        console.error('Debug endpoint error:', error);

        return new Response(JSON.stringify({
            error: 'Debug endpoint failed',
            message: error.message,
            timestamp: new Date().toISOString()
        }, null, 2), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
}