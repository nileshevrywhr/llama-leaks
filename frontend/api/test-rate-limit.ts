// Rate limiting test endpoint
import { getRateLimitData, incrementRateLimitCounters, checkRequestRateLimit } from '../src/lib/rate-limit';
import { validateKVEnvironment } from '../src/lib/kv';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
    try {
        console.log('[RateLimit-Test] Starting rate limit test');

        const testUserHash = 'test-user-' + Date.now();

        // Check KV environment
        const kvValid = validateKVEnvironment();
        console.log('[RateLimit-Test] KV environment valid:', kvValid);

        if (!kvValid) {
            return new Response(JSON.stringify({
                error: 'KV environment not valid',
                kvEnvironment: {
                    hasUrl: !!process.env.KV_REST_API_URL,
                    hasToken: !!process.env.KV_REST_API_TOKEN,
                    urlPrefix: process.env.KV_REST_API_URL?.substring(0, 30) + '...',
                    tokenPrefix: process.env.KV_REST_API_TOKEN?.substring(0, 10) + '...'
                },
                timestamp: new Date().toISOString()
            }, null, 2), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Test getting rate limit data
        let getRateLimitResult = null;
        try {
            console.log('[RateLimit-Test] Testing getRateLimitData...');
            getRateLimitResult = await getRateLimitData(testUserHash);
            console.log('[RateLimit-Test] getRateLimitData success:', getRateLimitResult);
        } catch (getRateLimitError) {
            console.error('[RateLimit-Test] getRateLimitData error:', getRateLimitError);
            getRateLimitResult = { error: getRateLimitError.message };
        }

        // Test checking request rate limit
        let checkRequestResult = null;
        try {
            console.log('[RateLimit-Test] Testing checkRequestRateLimit...');
            checkRequestResult = await checkRequestRateLimit(testUserHash);
            console.log('[RateLimit-Test] checkRequestRateLimit success:', checkRequestResult);
        } catch (checkRequestError) {
            console.error('[RateLimit-Test] checkRequestRateLimit error:', checkRequestError);
            checkRequestResult = { error: checkRequestError.message };
        }

        // Test incrementing counters
        let incrementResult = null;
        try {
            console.log('[RateLimit-Test] Testing incrementRateLimitCounters...');
            incrementResult = await incrementRateLimitCounters(testUserHash);
            console.log('[RateLimit-Test] incrementRateLimitCounters success:', incrementResult);
        } catch (incrementError) {
            console.error('[RateLimit-Test] incrementRateLimitCounters error:', incrementError);
            incrementResult = { error: incrementError.message };
        }

        const result = {
            timestamp: new Date().toISOString(),
            testUserHash,
            kvEnvironmentValid: kvValid,
            tests: {
                getRateLimitData: getRateLimitResult,
                checkRequestRateLimit: checkRequestResult,
                incrementRateLimitCounters: incrementResult
            }
        };

        return new Response(JSON.stringify(result, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            }
        });

    } catch (error) {
        console.error('[RateLimit-Test] Test endpoint error:', error);

        return new Response(JSON.stringify({
            error: 'Rate limit test failed',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        }, null, 2), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }
}