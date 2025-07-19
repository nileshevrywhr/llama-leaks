/**
 * Input validation and sanitization utilities
 * Provides security-focused validation for request headers and user input
 */

// Security constants
const MAX_HEADER_LENGTH = 8192; // Maximum allowed header length
const MAX_IP_LENGTH = 45; // Maximum IPv6 address length
const MAX_USER_AGENT_LENGTH = 2048; // Maximum reasonable User-Agent length
const MAX_LANGUAGE_LENGTH = 256; // Maximum Accept-Language length
const MAX_ENCODING_LENGTH = 256; // Maximum Accept-Encoding length

// Validation error types
export enum ValidationErrorType {
    HEADER_TOO_LONG = 'HEADER_TOO_LONG',
    INVALID_CHARACTERS = 'INVALID_CHARACTERS',
    SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
    MALFORMED_VALUE = 'MALFORMED_VALUE',
    INJECTION_ATTEMPT = 'INJECTION_ATTEMPT'
}

export interface ValidationError extends Error {
    type: ValidationErrorType;
    field: string;
    value?: string;
}

// Create a validation error
export function createValidationError(
    message: string,
    type: ValidationErrorType,
    field: string,
    value?: string
): ValidationError {
    const error = new Error(message) as ValidationError;
    error.type = type;
    error.field = field;
    error.value = value;
    return error;
}

/**
 * Sanitize a string by removing potentially dangerous characters
 * @param input Input string to sanitize
 * @param maxLength Maximum allowed length
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength: number = MAX_HEADER_LENGTH): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // Truncate if too long
    let sanitized = input.length > maxLength ? input.substring(0, maxLength) : input;

    // Remove null bytes and control characters (except tab, newline, carriage return)
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Remove potential script injection patterns
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
}

/**
 * Validate and sanitize IP address
 * @param ip IP address to validate
 * @returns Sanitized IP address or null if invalid
 */
export function validateAndSanitizeIP(ip: string): string | null {
    if (!ip || typeof ip !== 'string') {
        return null;
    }

    // Check length
    if (ip.length > MAX_IP_LENGTH) {
        console.warn('[Validation] IP address too long', {
            length: ip.length,
            maxLength: MAX_IP_LENGTH,
            timestamp: new Date().toISOString()
        });
        return null;
    }

    // Sanitize basic characters
    const sanitized = sanitizeString(ip, MAX_IP_LENGTH);

    // IPv4 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(sanitized)) {
        return sanitized;
    }

    // IPv6 validation (basic)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    if (ipv6Regex.test(sanitized)) {
        return sanitized;
    }

    // Compressed IPv6 validation
    if (sanitized.includes('::') && /^[0-9a-fA-F:]+$/.test(sanitized)) {
        // Additional validation for compressed IPv6
        const parts = sanitized.split('::');
        if (parts.length === 2) {
            return sanitized;
        }
    }

    console.warn('[Validation] Invalid IP address format', {
        original: ip.substring(0, 50) + (ip.length > 50 ? '...' : ''),
        sanitized: sanitized.substring(0, 50) + (sanitized.length > 50 ? '...' : ''),
        timestamp: new Date().toISOString()
    });

    return null;
}

/**
 * Validate and sanitize User-Agent header
 * @param userAgent User-Agent string to validate
 * @returns Sanitized User-Agent or null if invalid
 */
export function validateAndSanitizeUserAgent(userAgent: string): string | null {
    if (!userAgent || typeof userAgent !== 'string') {
        return null;
    }

    // Check length
    if (userAgent.length > MAX_USER_AGENT_LENGTH) {
        console.warn('[Validation] User-Agent too long', {
            length: userAgent.length,
            maxLength: MAX_USER_AGENT_LENGTH,
            timestamp: new Date().toISOString()
        });
        return null;
    }

    // Sanitize
    const sanitized = sanitizeString(userAgent, MAX_USER_AGENT_LENGTH);

    // Check for suspicious patterns
    const suspiciousPatterns = [
        /\b(curl|wget|python|java|perl|ruby|php)\b/i, // Common bot patterns
        /<[^>]+>/g, // HTML tags
        /\$\{[^}]+\}/g, // Template injection
        /\{\{[^}]+\}\}/g, // Template injection
        /\beval\s*\(/i, // Code execution
        /\bexec\s*\(/i, // Code execution
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(sanitized)) {
            console.warn('[Validation] Suspicious User-Agent pattern detected', {
                pattern: pattern.toString(),
                userAgent: sanitized.substring(0, 100) + (sanitized.length > 100 ? '...' : ''),
                timestamp: new Date().toISOString()
            });
            // Don't reject, but log for monitoring
        }
    }

    // Must contain some browser-like characteristics
    const browserPatterns = [
        /mozilla/i,
        /chrome/i,
        /safari/i,
        /firefox/i,
        /edge/i,
        /opera/i
    ];

    const hasBrowserPattern = browserPatterns.some(pattern => pattern.test(sanitized));
    if (!hasBrowserPattern && sanitized.length > 0) {
        console.warn('[Validation] User-Agent does not match browser patterns', {
            userAgent: sanitized.substring(0, 100) + (sanitized.length > 100 ? '...' : ''),
            timestamp: new Date().toISOString()
        });
        // Don't reject, but log for monitoring
    }

    return sanitized.length > 0 ? sanitized : null;
}

/**
 * Validate and sanitize Accept-Language header
 * @param acceptLanguage Accept-Language string to validate
 * @returns Sanitized Accept-Language or null if invalid
 */
export function validateAndSanitizeAcceptLanguage(acceptLanguage: string): string | null {
    if (!acceptLanguage || typeof acceptLanguage !== 'string') {
        return null;
    }

    // Check length
    if (acceptLanguage.length > MAX_LANGUAGE_LENGTH) {
        console.warn('[Validation] Accept-Language too long', {
            length: acceptLanguage.length,
            maxLength: MAX_LANGUAGE_LENGTH,
            timestamp: new Date().toISOString()
        });
        return null;
    }

    // Sanitize
    const sanitized = sanitizeString(acceptLanguage, MAX_LANGUAGE_LENGTH);

    // Validate format (basic language tag validation)
    const languageRegex = /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})*([,;]\s*[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})*[,;q=0-9.]*)*$/;
    if (!languageRegex.test(sanitized) && sanitized.length > 0) {
        console.warn('[Validation] Invalid Accept-Language format', {
            acceptLanguage: sanitized.substring(0, 100) + (sanitized.length > 100 ? '...' : ''),
            timestamp: new Date().toISOString()
        });
        // Don't reject, but log for monitoring
    }

    return sanitized.length > 0 ? sanitized : null;
}

/**
 * Validate and sanitize Accept-Encoding header
 * @param acceptEncoding Accept-Encoding string to validate
 * @returns Sanitized Accept-Encoding or null if invalid
 */
export function validateAndSanitizeAcceptEncoding(acceptEncoding: string): string | null {
    if (!acceptEncoding || typeof acceptEncoding !== 'string') {
        return null;
    }

    // Check length
    if (acceptEncoding.length > MAX_ENCODING_LENGTH) {
        console.warn('[Validation] Accept-Encoding too long', {
            length: acceptEncoding.length,
            maxLength: MAX_ENCODING_LENGTH,
            timestamp: new Date().toISOString()
        });
        return null;
    }

    // Sanitize
    const sanitized = sanitizeString(acceptEncoding, MAX_ENCODING_LENGTH);

    // Validate format (basic encoding validation)
    const encodingRegex = /^[a-zA-Z0-9\-*,;\s=.]+$/;
    if (!encodingRegex.test(sanitized) && sanitized.length > 0) {
        console.warn('[Validation] Invalid Accept-Encoding format', {
            acceptEncoding: sanitized.substring(0, 100) + (sanitized.length > 100 ? '...' : ''),
            timestamp: new Date().toISOString()
        });
        // Don't reject, but log for monitoring
    }

    return sanitized.length > 0 ? sanitized : null;
}

/**
 * Validate and sanitize custom header values
 * @param headerValue Header value to validate
 * @param headerName Header name for logging
 * @param maxLength Maximum allowed length
 * @returns Sanitized header value or null if invalid
 */
export function validateAndSanitizeCustomHeader(
    headerValue: string,
    headerName: string,
    maxLength: number = 256
): string | null {
    if (!headerValue || typeof headerValue !== 'string') {
        return null;
    }

    // Check length
    if (headerValue.length > maxLength) {
        console.warn('[Validation] Custom header too long', {
            headerName,
            length: headerValue.length,
            maxLength,
            timestamp: new Date().toISOString()
        });
        return null;
    }

    // Sanitize
    const sanitized = sanitizeString(headerValue, maxLength);

    // Check for injection attempts
    const injectionPatterns = [
        /\r\n/g, // CRLF injection
        /\n/g, // Newline injection
        /\r/g, // Carriage return injection
        /%0[ad]/gi, // URL-encoded CRLF
        /%2[2f]/gi, // URL-encoded quotes/slashes
    ];

    for (const pattern of injectionPatterns) {
        if (pattern.test(sanitized)) {
            console.error('[Validation] Header injection attempt detected', {
                headerName,
                pattern: pattern.toString(),
                value: sanitized.substring(0, 100) + (sanitized.length > 100 ? '...' : ''),
                timestamp: new Date().toISOString()
            });
            return null; // Reject injection attempts
        }
    }

    return sanitized.length > 0 ? sanitized : null;
}

/**
 * Validate request headers for security issues
 * @param headers Headers object to validate
 * @returns Validation result with sanitized headers
 */
export function validateRequestHeaders(headers: Headers): {
    valid: boolean;
    sanitizedHeaders: Map<string, string>;
    errors: ValidationError[];
    warnings: string[];
} {
    const sanitizedHeaders = new Map<string, string>();
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Check for suspicious header patterns
    const suspiciousHeaders = [
        'x-forwarded-host',
        'x-original-url',
        'x-rewrite-url',
        'x-forwarded-proto'
    ];

    headers.forEach((value, name) => {
        const lowerName = name.toLowerCase();

        // Check for suspicious headers that might indicate proxy manipulation
        if (suspiciousHeaders.includes(lowerName)) {
            warnings.push(`Suspicious header detected: ${name}`);
        }

        // Validate specific headers
        try {
            let sanitizedValue: string | null = null;

            switch (lowerName) {
                case 'x-forwarded-for':
                case 'x-real-ip':
                case 'x-client-ip':
                case 'cf-connecting-ip':
                    // Validate IP headers
                    const ips = value.split(',').map(ip => validateAndSanitizeIP(ip.trim())).filter(Boolean);
                    if (ips.length > 0) {
                        sanitizedValue = ips.join(', ');
                    }
                    break;

                case 'user-agent':
                    sanitizedValue = validateAndSanitizeUserAgent(value);
                    break;

                case 'accept-language':
                    sanitizedValue = validateAndSanitizeAcceptLanguage(value);
                    break;

                case 'accept-encoding':
                    sanitizedValue = validateAndSanitizeAcceptEncoding(value);
                    break;

                case 'x-screen-resolution':
                    // Custom header for screen resolution
                    sanitizedValue = validateAndSanitizeCustomHeader(value, name, 32);
                    if (sanitizedValue && !/^\d+x\d+$/.test(sanitizedValue)) {
                        warnings.push(`Invalid screen resolution format: ${name}`);
                        sanitizedValue = null;
                    }
                    break;

                case 'x-timezone-offset':
                    // Custom header for timezone offset
                    sanitizedValue = validateAndSanitizeCustomHeader(value, name, 16);
                    if (sanitizedValue && !/^-?\d+$/.test(sanitizedValue)) {
                        warnings.push(`Invalid timezone offset format: ${name}`);
                        sanitizedValue = null;
                    }
                    break;

                default:
                    // Generic header validation
                    if (lowerName.startsWith('x-') || lowerName.startsWith('cf-')) {
                        sanitizedValue = validateAndSanitizeCustomHeader(value, name);
                    } else {
                        // Standard headers - basic sanitization only
                        sanitizedValue = sanitizeString(value);
                    }
                    break;
            }

            if (sanitizedValue !== null) {
                sanitizedHeaders.set(name, sanitizedValue);
            }
        } catch (error) {
            errors.push(createValidationError(
                `Header validation failed: ${error.message}`,
                ValidationErrorType.MALFORMED_VALUE,
                name,
                value.substring(0, 100)
            ));
        }
    });

    const valid = errors.length === 0;

    if (!valid) {
        console.error('[Validation] Request header validation failed', {
            errorCount: errors.length,
            warningCount: warnings.length,
            timestamp: new Date().toISOString()
        });
    } else if (warnings.length > 0) {
        console.warn('[Validation] Request header validation warnings', {
            warningCount: warnings.length,
            warnings: warnings.slice(0, 5), // Log first 5 warnings
            timestamp: new Date().toISOString()
        });
    }

    return {
        valid,
        sanitizedHeaders,
        errors,
        warnings
    };
}

/**
 * Check if a request appears to be from a legitimate browser
 * @param headers Request headers
 * @returns True if request appears legitimate
 */
export function isLegitimateRequest(headers: Headers): boolean {
    const userAgent = headers.get('user-agent');
    const acceptLanguage = headers.get('accept-language');
    const acceptEncoding = headers.get('accept-encoding');

    // Must have basic browser headers
    if (!userAgent || !acceptLanguage || !acceptEncoding) {
        console.warn('[Validation] Missing basic browser headers', {
            hasUserAgent: !!userAgent,
            hasAcceptLanguage: !!acceptLanguage,
            hasAcceptEncoding: !!acceptEncoding,
            timestamp: new Date().toISOString()
        });
        return false;
    }

    // User agent should look like a browser
    const browserPatterns = [
        /mozilla/i,
        /chrome/i,
        /safari/i,
        /firefox/i,
        /edge/i,
        /opera/i
    ];

    const hasBrowserPattern = browserPatterns.some(pattern => pattern.test(userAgent));
    if (!hasBrowserPattern) {
        console.warn('[Validation] User-Agent does not match browser patterns', {
            userAgent: userAgent.substring(0, 100) + (userAgent.length > 100 ? '...' : ''),
            timestamp: new Date().toISOString()
        });
        return false;
    }

    return true;
}