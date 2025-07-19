import { kv } from '@vercel/kv';

// KV connection configuration
export const kvClient = kv;

// Environment validation
export function validateKVEnvironment(): boolean {
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;

    if (!kvUrl || !kvToken) {
        console.warn('KV environment variables not configured. Rate limiting will be disabled.');
        return false;
    }

    if (kvUrl.includes('your-kv-database-url') || kvToken.includes('your-kv-rest-api-token')) {
        console.warn('KV environment variables contain placeholder values. Rate limiting will be disabled.');
        return false;
    }

    return true;
}

// Test KV connection
export async function testKVConnection(): Promise<boolean> {
    try {
        if (!validateKVEnvironment()) {
            return false;
        }

        // Test connection with a simple ping
        await kvClient.set('test:connection', 'ok', { ex: 10 });
        const result = await kvClient.get('test:connection');
        await kvClient.del('test:connection');

        return result === 'ok';
    } catch (error) {
        console.error('KV connection test failed:', error);
        return false;
    }
}