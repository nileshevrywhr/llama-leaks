/**
 * User identification utilities for rate limiting
 * Handles IP extraction, browser fingerprinting, and composite user identification
 */

/**
 * Interface for browser fingerprint data
 */
export interface FingerprintData {
    userAgent: string;
    acceptLanguage: string;
    acceptEncoding: string;
    screenResolution?: string;
    timezoneOffset?: number;
}

/**
 * Extracts the real IP address from Vercel request headers
 * Handles X-Forwarded-For chains and various proxy scenarios
 */
export function extractIPFromHeaders(headers: Headers): string {
    // Try X-Forwarded-For first (most common for proxied requests)
    const xForwardedFor = headers.get('x-forwarded-for');
    if (xForwardedFor) {
        // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
        // The first IP is typically the original client IP
        const ips = xForwardedFor.split(',').map(ip => ip.trim());
        const clientIP = ips[0];

        // Validate that it's a proper IP address (basic validation)
        if (isValidIP(clientIP)) {
            return clientIP;
        }
    }

    // Try X-Real-IP (used by some proxies)
    const xRealIP = headers.get('x-real-ip');
    if (xRealIP && isValidIP(xRealIP.trim())) {
        return xRealIP.trim();
    }

    // Try X-Client-IP (less common but sometimes used)
    const xClientIP = headers.get('x-client-ip');
    if (xClientIP && isValidIP(xClientIP.trim())) {
        return xClientIP.trim();
    }

    // Try CF-Connecting-IP (Cloudflare specific, but might be present)
    const cfConnectingIP = headers.get('cf-connecting-ip');
    if (cfConnectingIP && isValidIP(cfConnectingIP.trim())) {
        return cfConnectingIP.trim();
    }

    // Fallback to a default IP if no valid IP is found
    // This should rarely happen in production but provides a safe fallback
    return '0.0.0.0';
}

/**
 * Basic IP address validation
 * Checks for IPv4 and IPv6 format
 */
function isValidIP(ip: string): boolean {
    if (!ip || ip.length === 0) {
        return false;
    }

    // IPv4 validation (basic regex)
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(ip)) {
        return true;
    }

    // IPv6 validation (basic check for colons and hex characters)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    if (ipv6Regex.test(ip)) {
        return true;
    }

    // Check for compressed IPv6 addresses
    if (ip.includes('::') && /^[0-9a-fA-F:]+$/.test(ip)) {
        return true;
    }

    return false;
}
/**
 * E
xtracts browser fingerprint data from request headers
 * Creates a consistent fingerprint from browser characteristics
 */
export function extractFingerprintFromHeaders(headers: Headers): FingerprintData {
    const userAgent = headers.get('user-agent') || '';
    const acceptLanguage = headers.get('accept-language') || '';
    const acceptEncoding = headers.get('accept-encoding') || '';

    // Optional fields that might be provided by client-side code
    const screenResolution = headers.get('x-screen-resolution') || undefined;
    const timezoneOffsetHeader = headers.get('x-timezone-offset');
    const timezoneOffset = timezoneOffsetHeader ? parseInt(timezoneOffsetHeader, 10) : undefined;

    return {
        userAgent,
        acceptLanguage,
        acceptEncoding,
        screenResolution,
        timezoneOffset: isNaN(timezoneOffset as number) ? undefined : timezoneOffset,
    };
}

/**
 * Generates a consistent hash from fingerprint data
 * Uses a simple but effective hashing algorithm
 */
export function generateFingerprintHash(fingerprintData: FingerprintData): string {
    // Create a consistent string representation of the fingerprint
    const fingerprintString = [
        fingerprintData.userAgent,
        fingerprintData.acceptLanguage,
        fingerprintData.acceptEncoding,
        fingerprintData.screenResolution || '',
        fingerprintData.timezoneOffset?.toString() || '',
    ].join('|');

    // Generate a simple hash (we'll use a basic hash function for now)
    // In a production environment, you might want to use a more robust hashing library
    return simpleHash(fingerprintString);
}

/**
 * Simple hash function for generating consistent fingerprint hashes
 * This is a basic implementation - in production you might want to use crypto.subtle
 */
function simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();

    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to positive hex string
    return Math.abs(hash).toString(16);
}

/**
 * Validates that fingerprint data contains sufficient information
 * Returns true if the fingerprint has enough data to be reliable
 */
export function isValidFingerprint(fingerprintData: FingerprintData): boolean {
    // At minimum, we need a user agent to create a meaningful fingerprint
    if (!fingerprintData.userAgent || fingerprintData.userAgent.trim().length === 0) {
        return false;
    }

    // User agent should look like a real browser user agent (basic validation)
    const userAgent = fingerprintData.userAgent.toLowerCase();
    const hasValidUserAgent = userAgent.includes('mozilla') ||
        userAgent.includes('chrome') ||
        userAgent.includes('safari') ||
        userAgent.includes('firefox') ||
        userAgent.includes('edge');

    return hasValidUserAgent;
}

/**
 * Creates a browser fingerprint from request headers
 * Returns the fingerprint hash or null if fingerprinting fails
 */
export function createBrowserFingerprint(headers: Headers): string | null {
    try {
        const fingerprintData = extractFingerprintFromHeaders(headers);

        if (!isValidFingerprint(fingerprintData)) {
            return null;
        }

        return generateFingerprintHash(fingerprintData);
    } catch (error) {
        // If fingerprinting fails for any reason, return null
        console.error('Browser fingerprinting failed:', error);
        return null;
    }
}/
    **
 * Interface for user identifier data
    */
export interface UserIdentifier {
        ip: string;
        fingerprint: string | null;
        hash: string;
    }

/**
 * Creates a SHA-256 hash using Web Crypto API (browser) or crypto module (Node.js)
 * Falls back to simple hash if crypto is not available
 */
async function createSHA256Hash(data: string): Promise<string> {
    try {
        // Try Web Crypto API first (browser environment)
        if (typeof crypto !== 'undefined' && crypto.subtle) {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(data);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // Try Node.js crypto module
        if (typeof require !== 'undefined') {
            const crypto = require('crypto');
            return crypto.createHash('sha256').update(data).digest('hex');
        }

        // Fallback to simple hash if crypto is not available
        return simpleHash(data);
    } catch (error) {
        // If any crypto operation fails, fallback to simple hash
        console.warn('SHA-256 hashing failed, using fallback:', error);
        return simpleHash(data);
    }
}

/**
 * Synchronous version of SHA-256 hash for environments where async is not suitable
 * Uses simple hash as fallback
 */
function createSHA256HashSync(data: string): string {
    try {
        // Try Node.js crypto module (synchronous)
        if (typeof require !== 'undefined') {
            const crypto = require('crypto');
            return crypto.createHash('sha256').update(data).digest('hex');
        }

        // Fallback to simple hash
        return simpleHash(data);
    } catch (error) {
        // If crypto operation fails, fallback to simple hash
        console.warn('Synchronous SHA-256 hashing failed, using fallback:', error);
        return simpleHash(data);
    }
}

/**
 * Generates a composite user identifier from IP and fingerprint
 * Combines IP address and browser fingerprint into a SHA-256 hash
 */
export function generateUserIdentifier(ip: string, fingerprint: string | null): UserIdentifier {
    // Create the composite identifier string
    const compositeString = fingerprint ? `${ip}|${fingerprint}` : ip;

    // Generate SHA-256 hash (synchronous version for simplicity)
    const hash = createSHA256HashSync(compositeString);

    return {
        ip,
        fingerprint,
        hash
    };
}

/**
 * Async version of generateUserIdentifier for environments that support it
 */
export async function generateUserIdentifierAsync(ip: string, fingerprint: string | null): Promise<UserIdentifier> {
    // Create the composite identifier string
    const compositeString = fingerprint ? `${ip}|${fingerprint}` : ip;

    // Generate SHA-256 hash
    const hash = await createSHA256Hash(compositeString);

    return {
        ip,
        fingerprint,
        hash
    };
}

/**
 * Creates a complete user identifier from request headers
 * Extracts IP and fingerprint, then generates composite hash
 * Implements fallback to IP-only identification when fingerprinting fails
 */
export function createUserIdentifierFromHeaders(headers: Headers): UserIdentifier {
    // Extract IP address
    const ip = extractIPFromHeaders(headers);

    // Try to create browser fingerprint
    const fingerprint = createBrowserFingerprint(headers);

    // Generate composite identifier (will fallback to IP-only if fingerprint is null)
    return generateUserIdentifier(ip, fingerprint);
}

/**
 * Async version of createUserIdentifierFromHeaders
 */
export async function createUserIdentifierFromHeadersAsync(headers: Headers): Promise<UserIdentifier> {
    // Extract IP address
    const ip = extractIPFromHeaders(headers);

    // Try to create browser fingerprint
    const fingerprint = createBrowserFingerprint(headers);

    // Generate composite identifier (will fallback to IP-only if fingerprint is null)
    return await generateUserIdentifierAsync(ip, fingerprint);
}

/**
 * Validates that a user identifier has sufficient data for rate limiting
 */
export function isValidUserIdentifier(userIdentifier: UserIdentifier): boolean {
    // Must have a valid IP address
    if (!userIdentifier.ip || userIdentifier.ip === '0.0.0.0') {
        return false;
    }

    // Must have a hash
    if (!userIdentifier.hash || userIdentifier.hash.length === 0) {
        return false;
    }

    return true;
}