// KV connection test endpoint
import { testKVConnection, getKVHealthStatus, validateKVEnvironment } from '../src/lib/kv';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
    try {
        console.log('[KV-Test] Starting KV connection test');

        // Check environment variables
        const envCheck = {
            hasKvUrl: !!process.env.KV_REST_API_URL,
            hasKvToken: !!process.env.KV_REST_API_TOKEN,
            kvUrlPrefix: process.env.KV_REST_API_URL?.substring(0, 30) + '...',
            kvTokenPrefix: process.env.KV_REST_API_TOKEN?.substring(0, 10) + '...',
            nodeEnv: process.env.NODE_ENV,
            vercelUrl: process.env.VERCEL_URL
        };

        console.log('[KV-Test] Environment check:', envCheck);

        // Validate environment
        const environmentValid = validateKVEnvironment();
        console.log('[KV-Test] Environment validation:', environmentValid);

        // Get health status
        const healthStatus = await getKVHealthStatus();
        console.log('[KV-Test] Health status:', healthStatus);

        // Test connection directly
        let connectionTest = null;
        try {
            connectionTest = await testKVConnection();
            console.log('[KV-Test] Direct connection test:', connectionTest);
        } catch (testError) {
            console.error('[KV-Test] Connection test error:', testError);
            connectionTest = { error: testError.message };
        }

        const result = {
            timestamp: new Date().toISOString(),
            environment: envCheck,
            environmentValid,
            healthStatus,
            connectionTest,
            runtime: 'edge'
        };

        return new Response(JSON.stringify(result, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            }
        });

    } catch (error) {
        console.error('[KV-Test] Test endpoint error:', error);

        return new Response(JSON.stringify({
            error: 'KV test failed',
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