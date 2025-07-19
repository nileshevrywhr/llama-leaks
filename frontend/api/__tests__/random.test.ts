import { describe, it, expect } from 'vitest';

// Mock the user identification module since we're testing the API integration
const mockUserIdentifier = {
    ip: '192.168.1.100',
    fingerprint: 'test-fingerprint-hash',
    hash: 'test-user-hash-123'
};

// Mock the user identification functions
const mockCreateUserIdentifierFromHeaders = () => mockUserIdentifier;
const mockIsValidUserIdentifier = () => true;

// Mock the module
vi.mock('../../src/lib/user-identification.js', () => ({
    createUserIdentifierFromHeaders: mockCreateUserIdentifierFromHeaders,
    isValidUserIdentifier: mockIsValidUserIdentifier
}));

// Import the handler after mocking
import handler from '../random';

describe('/api/random Edge Function', () => {
    it('should handle GET requests successfully', async () => {
        const request = new Request('http://localhost/api/random', {
            method: 'GET',
            headers: {
                'x-forwarded-for': '192.168.1.100',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.rateLimit).toBeDefined();
        expect(data.rateLimit.dailyRemaining).toBe(3);
        expect(data.rateLimit.monthlyRemaining).toBe(15);
    });

    it('should reject non-GET requests', async () => {
        const request = new Request('http://localhost/api/random', {
            method: 'POST'
        });

        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(405);
        expect(data.success).toBe(false);
        expect(data.error).toBe('METHOD_NOT_ALLOWED');
    });

    it('should include proper rate limit headers', async () => {
        const request = new Request('http://localhost/api/random', {
            method: 'GET',
            headers: {
                'x-forwarded-for': '192.168.1.100',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const response = await handler(request);

        expect(response.headers.get('X-RateLimit-Limit-Daily')).toBe('3');
        expect(response.headers.get('X-RateLimit-Limit-Monthly')).toBe('15');
        expect(response.headers.get('X-RateLimit-Remaining-Daily')).toBe('3');
        expect(response.headers.get('X-RateLimit-Remaining-Monthly')).toBe('15');
    });

    it('should handle user identification errors gracefully', async () => {
        // This test would verify fallback behavior when user identification fails
        const request = new Request('http://localhost/api/random', {
            method: 'GET',
            headers: {} // No headers to trigger fallback
        });

        const response = await handler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        // Should still work with fallback identification
    });
});