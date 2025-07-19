/**
 * Tests for input validation and sanitization utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    ValidationErrorType,
    createValidationError,
    sanitizeString,
    validateAndSanitizeIP,
    validateAndSanitizeUserAgent,
    validateAndSanitizeAcceptLanguage,
    validateAndSanitizeAcceptEncoding,
    validateAndSanitizeCustomHeader,
    validateRequestHeaders,
    isLegitimateRequest
} from '../input-validation';

// Mock console methods
const consoleSpy = {
    warn: vi.spyOn(console, 'warn').mockImplementation(() => { }),
    error: vi.spyOn(console, 'error').mockImplementation(() => { })
};

describe('Input Validation and Sanitization', () => {
    beforeEach(() => {
        // Clear console spy calls
        Object.values(consoleSpy).forEach(spy => spy.mockClear());
    });

    describe('createValidationError', () => {
        it('should create a validation error with all properties', () => {
            const error = createValidationError(
                'Test error message',
                ValidationErrorType.HEADER_TOO_LONG,
                'user-agent',
                'test-value'
            );

            expect(error.message).toBe('Test error message');
            expect(error.type).toBe(ValidationErrorType.HEADER_TOO_LONG);
            expect(error.field).toBe('user-agent');
            expect(error.value).toBe('test-value');
            expect(error instanceof Error).toBe(true);
        });

        it('should create a validation error without value', () => {
            const error = createValidationError(
                'Test error message',
                ValidationErrorType.INVALID_CHARACTERS,
                'accept-language'
            );

            expect(error.message).toBe('Test error message');
            expect(error.type).toBe(ValidationErrorType.INVALID_CHARACTERS);
            expect(error.field).toBe('accept-language');
            expect(error.value).toBeUndefined();
        });
    });

    describe('sanitizeString', () => {
        it('should remove null bytes and control characters', () => {
            const input = 'Hello\x00World\x01Test\x1F';
            const result = sanitizeString(input);
            expect(result).toBe('HelloWorldTest');
        });

        it('should preserve tab, newline, and carriage return', () => {
            const input = 'Hello\tWorld\nTest\r';
            const result = sanitizeString(input);
            expect(result).toBe('Hello\tWorld\nTest\r');
        });

        it('should remove script tags', () => {
            const input = 'Hello<script>alert("xss")</script>World';
            const result = sanitizeString(input);
            expect(result).toBe('HelloWorld');
        });

        it('should remove javascript: protocol', () => {
            const input = 'javascript:alert("xss")';
            const result = sanitizeString(input);
            expect(result).toBe('alert("xss")');
        });

        it('should remove vbscript: protocol', () => {
            const input = 'vbscript:msgbox("xss")';
            const result = sanitizeString(input);
            expect(result).toBe('msgbox("xss")');
        });

        it('should remove event handlers', () => {
            const input = 'onclick=alert("xss") onload=test()';
            const result = sanitizeString(input);
            expect(result).toBe('alert("xss") test()');
        });

        it('should truncate strings that are too long', () => {
            const input = 'a'.repeat(10000);
            const result = sanitizeString(input, 100);
            expect(result.length).toBe(100);
        });

        it('should trim whitespace', () => {
            const input = '  Hello World  ';
            const result = sanitizeString(input);
            expect(result).toBe('Hello World');
        });

        it('should handle null and undefined input', () => {
            expect(sanitizeString(null as any)).toBe('');
            expect(sanitizeString(undefined as any)).toBe('');
            expect(sanitizeString('')).toBe('');
        });

        it('should handle non-string input', () => {
            expect(sanitizeString(123 as any)).toBe('');
            expect(sanitizeString({} as any)).toBe('');
            expect(sanitizeString([] as any)).toBe('');
        });
    });

    describe('validateAndSanitizeIP', () => {
        it('should validate IPv4 addresses', () => {
            expect(validateAndSanitizeIP('192.168.1.1')).toBe('192.168.1.1');
            expect(validateAndSanitizeIP('127.0.0.1')).toBe('127.0.0.1');
            expect(validateAndSanitizeIP('255.255.255.255')).toBe('255.255.255.255');
            expect(validateAndSanitizeIP('0.0.0.0')).toBe('0.0.0.0');
        });

        it('should validate IPv6 addresses', () => {
            expect(validateAndSanitizeIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334'))
                .toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
            expect(validateAndSanitizeIP('::1')).toBe('::1');
            expect(validateAndSanitizeIP('::')).toBe('::');
        });

        it('should validate compressed IPv6 addresses', () => {
            expect(validateAndSanitizeIP('2001:db8::1')).toBe('2001:db8::1');
            expect(validateAndSanitizeIP('::ffff:192.0.2.1')).toBe('::ffff:192.0.2.1');
        });

        it('should reject invalid IPv4 addresses', () => {
            expect(validateAndSanitizeIP('256.256.256.256')).toBeNull();
            expect(validateAndSanitizeIP('192.168.1')).toBeNull();
            expect(validateAndSanitizeIP('192.168.1.1.1')).toBeNull();
            expect(validateAndSanitizeIP('not.an.ip.address')).toBeNull();
        });

        it('should reject invalid IPv6 addresses', () => {
            expect(validateAndSanitizeIP('2001:0db8:85a3::8a2e::7334')).toBeNull(); // Double ::
            expect(validateAndSanitizeIP('gggg::1')).toBeNull(); // Invalid hex
        });

        it('should handle null and undefined input', () => {
            expect(validateAndSanitizeIP(null as any)).toBeNull();
            expect(validateAndSanitizeIP(undefined as any)).toBeNull();
            expect(validateAndSanitizeIP('')).toBeNull();
        });

        it('should handle non-string input', () => {
            expect(validateAndSanitizeIP(123 as any)).toBeNull();
            expect(validateAndSanitizeIP({} as any)).toBeNull();
        });

        it('should reject IP addresses that are too long', () => {
            const longIP = '192.168.1.1' + 'x'.repeat(100);
            expect(validateAndSanitizeIP(longIP)).toBeNull();
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[Validation] IP address too long'),
                expect.any(Object)
            );
        });

        it('should sanitize IP addresses with extra characters', () => {
            expect(validateAndSanitizeIP(' 192.168.1.1 ')).toBe('192.168.1.1');
        });
    });

    describe('validateAndSanitizeUserAgent', () => {
        it('should validate legitimate browser user agents', () => {
            const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            expect(validateAndSanitizeUserAgent(chromeUA)).toBe(chromeUA);

            const firefoxUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
            expect(validateAndSanitizeUserAgent(firefoxUA)).toBe(firefoxUA);

            const safariUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
            expect(validateAndSanitizeUserAgent(safariUA)).toBe(safariUA);
        });

        it('should detect suspicious patterns in user agents', () => {
            const botUA = 'curl/7.68.0';
            const result = validateAndSanitizeUserAgent(botUA);
            expect(result).toBe(botUA); // Still returns it but logs warning
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[Validation] Suspicious User-Agent pattern detected'),
                expect.any(Object)
            );
        });

        it('should detect non-browser user agents', () => {
            const customUA = 'MyCustomApp/1.0';
            const result = validateAndSanitizeUserAgent(customUA);
            expect(result).toBe(customUA); // Still returns it but logs warning
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[Validation] User-Agent does not match browser patterns'),
                expect.any(Object)
            );
        });

        it('should reject user agents that are too long', () => {
            const longUA = 'Mozilla/5.0 ' + 'x'.repeat(3000);
            expect(validateAndSanitizeUserAgent(longUA)).toBeNull();
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[Validation] User-Agent too long'),
                expect.any(Object)
            );
        });

        it('should sanitize user agents with dangerous content', () => {
            const maliciousUA = 'Mozilla/5.0 <script>alert("xss")</script>';
            const result = validateAndSanitizeUserAgent(maliciousUA);
            expect(result).toBe('Mozilla/5.0');
        });

        it('should handle null and undefined input', () => {
            expect(validateAndSanitizeUserAgent(null as any)).toBeNull();
            expect(validateAndSanitizeUserAgent(undefined as any)).toBeNull();
            expect(validateAndSanitizeUserAgent('')).toBeNull();
        });

        it('should handle non-string input', () => {
            expect(validateAndSanitizeUserAgent(123 as any)).toBeNull();
            expect(validateAndSanitizeUserAgent({} as any)).toBeNull();
        });
    });

    describe('validateAndSanitizeAcceptLanguage', () => {
        it('should validate legitimate Accept-Language headers', () => {
            expect(validateAndSanitizeAcceptLanguage('en-US,en;q=0.9')).toBe('en-US,en;q=0.9');
            expect(validateAndSanitizeAcceptLanguage('fr-FR,fr;q=0.9,en;q=0.8')).toBe('fr-FR,fr;q=0.9,en;q=0.8');
            expect(validateAndSanitizeAcceptLanguage('de')).toBe('de');
        });

        it('should handle invalid Accept-Language format', () => {
            const invalidLang = 'invalid-language-format-123';
            const result = validateAndSanitizeAcceptLanguage(invalidLang);
            expect(result).toBe(invalidLang); // Still returns it but logs warning
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[Validation] Invalid Accept-Language format'),
                expect.any(Object)
            );
        });

        it('should reject Accept-Language headers that are too long', () => {
            const longLang = 'en-US,' + 'x'.repeat(300);
            expect(validateAndSanitizeAcceptLanguage(longLang)).toBeNull();
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[Validation] Accept-Language too long'),
                expect.any(Object)
            );
        });

        it('should sanitize Accept-Language headers', () => {
            const maliciousLang = 'en-US<script>alert("xss")</script>';
            const result = validateAndSanitizeAcceptLanguage(maliciousLang);
            expect(result).toBe('en-US');
        });

        it('should handle null and undefined input', () => {
            expect(validateAndSanitizeAcceptLanguage(null as any)).toBeNull();
            expect(validateAndSanitizeAcceptLanguage(undefined as any)).toBeNull();
            expect(validateAndSanitizeAcceptLanguage('')).toBeNull();
        });
    });

    describe('validateAndSanitizeAcceptEncoding', () => {
        it('should validate legitimate Accept-Encoding headers', () => {
            expect(validateAndSanitizeAcceptEncoding('gzip, deflate, br')).toBe('gzip, deflate, br');
            expect(validateAndSanitizeAcceptEncoding('gzip;q=1.0, identity; q=0.5, *;q=0')).toBe('gzip;q=1.0, identity; q=0.5, *;q=0');
        });

        it('should handle invalid Accept-Encoding format', () => {
            const invalidEncoding = 'invalid@encoding#format';
            const result = validateAndSanitizeAcceptEncoding(invalidEncoding);
            expect(result).toBe(invalidEncoding); // Still returns it but logs warning
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[Validation] Invalid Accept-Encoding format'),
                expect.any(Object)
            );
        });

        it('should reject Accept-Encoding headers that are too long', () => {
            const longEncoding = 'gzip, ' + 'x'.repeat(300);
            expect(validateAndSanitizeAcceptEncoding(longEncoding)).toBeNull();
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[Validation] Accept-Encoding too long'),
                expect.any(Object)
            );
        });

        it('should sanitize Accept-Encoding headers', () => {
            const maliciousEncoding = 'gzip<script>alert("xss")</script>';
            const result = validateAndSanitizeAcceptEncoding(maliciousEncoding);
            expect(result).toBe('gzip');
        });

        it('should handle null and undefined input', () => {
            expect(validateAndSanitizeAcceptEncoding(null as any)).toBeNull();
            expect(validateAndSanitizeAcceptEncoding(undefined as any)).toBeNull();
            expect(validateAndSanitizeAcceptEncoding('')).toBeNull();
        });
    });

    describe('validateAndSanitizeCustomHeader', () => {
        it('should validate legitimate custom headers', () => {
            expect(validateAndSanitizeCustomHeader('1920x1080', 'x-screen-resolution')).toBe('1920x1080');
            expect(validateAndSanitizeCustomHeader('-300', 'x-timezone-offset')).toBe('-300');
        });

        it('should reject headers that are too long', () => {
            const longValue = 'x'.repeat(300);
            expect(validateAndSanitizeCustomHeader(longValue, 'x-custom', 100)).toBeNull();
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[Validation] Custom header too long'),
                expect.any(Object)
            );
        });

        it('should detect and reject injection attempts', () => {
            const injectionAttempts = [
                'value\r\nInjected-Header: malicious',
                'value\nInjected-Header: malicious',
                'value\rInjected-Header: malicious',
                'value%0aInjected-Header: malicious',
                'value%0dInjected-Header: malicious',
                'value%2fpath/traversal'
            ];

            injectionAttempts.forEach(attempt => {
                expect(validateAndSanitizeCustomHeader(attempt, 'x-test')).toBeNull();
                expect(consoleSpy.error).toHaveBeenCalledWith(
                    expect.stringContaining('[Validation] Header injection attempt detected'),
                    expect.any(Object)
                );
            });
        });

        it('should sanitize custom headers', () => {
            const maliciousValue = '1920x1080<script>alert("xss")</script>';
            const result = validateAndSanitizeCustomHeader(maliciousValue, 'x-screen-resolution');
            expect(result).toBe('1920x1080');
        });

        it('should handle null and undefined input', () => {
            expect(validateAndSanitizeCustomHeader(null as any, 'x-test')).toBeNull();
            expect(validateAndSanitizeCustomHeader(undefined as any, 'x-test')).toBeNull();
            expect(validateAndSanitizeCustomHeader('', 'x-test')).toBeNull();
        });
    });

    describe('validateRequestHeaders', () => {
        it('should validate legitimate request headers', () => {
            const headers = new Headers({
                'x-forwarded-for': '192.168.1.1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'accept-language': 'en-US,en;q=0.9',
                'accept-encoding': 'gzip, deflate, br'
            });

            const result = validateRequestHeaders(headers);

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.sanitizedHeaders.get('x-forwarded-for')).toBe('192.168.1.1');
            expect(result.sanitizedHeaders.get('user-agent')).toContain('Mozilla/5.0');
        });

        it('should handle multiple IPs in X-Forwarded-For', () => {
            const headers = new Headers({
                'x-forwarded-for': '192.168.1.1, 10.0.0.1, invalid-ip, 172.16.0.1'
            });

            const result = validateRequestHeaders(headers);

            expect(result.valid).toBe(true);
            expect(result.sanitizedHeaders.get('x-forwarded-for')).toBe('192.168.1.1, 10.0.0.1, 172.16.0.1');
        });

        it('should validate custom headers', () => {
            const headers = new Headers({
                'x-screen-resolution': '1920x1080',
                'x-timezone-offset': '-300'
            });

            const result = validateRequestHeaders(headers);

            expect(result.valid).toBe(true);
            expect(result.sanitizedHeaders.get('x-screen-resolution')).toBe('1920x1080');
            expect(result.sanitizedHeaders.get('x-timezone-offset')).toBe('-300');
        });

        it('should warn about invalid custom header formats', () => {
            const headers = new Headers({
                'x-screen-resolution': 'invalid-resolution',
                'x-timezone-offset': 'not-a-number'
            });

            const result = validateRequestHeaders(headers);

            expect(result.valid).toBe(true);
            expect(result.warnings).toContain('Invalid screen resolution format: x-screen-resolution');
            expect(result.warnings).toContain('Invalid timezone offset format: x-timezone-offset');
        });

        it('should detect suspicious headers', () => {
            const headers = new Headers({
                'x-forwarded-host': 'malicious.com',
                'x-original-url': '/admin',
                'x-rewrite-url': '/secret'
            });

            const result = validateRequestHeaders(headers);

            expect(result.valid).toBe(true);
            expect(result.warnings).toContain('Suspicious header detected: x-forwarded-host');
            expect(result.warnings).toContain('Suspicious header detected: x-original-url');
            expect(result.warnings).toContain('Suspicious header detected: x-rewrite-url');
        });

        it('should handle validation errors gracefully', () => {
            const headers = new Headers({
                'user-agent': 'x'.repeat(3000) // Too long
            });

            const result = validateRequestHeaders(headers);

            expect(result.valid).toBe(true); // Still valid because user-agent validation doesn't throw errors
            expect(result.sanitizedHeaders.has('user-agent')).toBe(false);
        });

        it('should sanitize all header values', () => {
            const headers = new Headers({
                'user-agent': 'Mozilla/5.0<script>alert("xss")</script>',
                'accept-language': 'en-US<script>alert("xss")</script>',
                'custom-header': 'value<script>alert("xss")</script>'
            });

            const result = validateRequestHeaders(headers);

            expect(result.valid).toBe(true);
            expect(result.sanitizedHeaders.get('user-agent')).toBe('Mozilla/5.0');
            expect(result.sanitizedHeaders.get('accept-language')).toBe('en-US');
            expect(result.sanitizedHeaders.get('custom-header')).toBe('value');
        });
    });

    describe('isLegitimateRequest', () => {
        it('should identify legitimate browser requests', () => {
            const headers = new Headers({
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'accept-language': 'en-US,en;q=0.9',
                'accept-encoding': 'gzip, deflate, br'
            });

            expect(isLegitimateRequest(headers)).toBe(true);
        });

        it('should detect missing basic headers', () => {
            const headers = new Headers({
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                // Missing accept-language and accept-encoding
            });

            expect(isLegitimateRequest(headers)).toBe(false);
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[Validation] Missing basic browser headers'),
                expect.any(Object)
            );
        });

        it('should detect non-browser user agents', () => {
            const headers = new Headers({
                'user-agent': 'curl/7.68.0',
                'accept-language': 'en-US,en;q=0.9',
                'accept-encoding': 'gzip, deflate, br'
            });

            expect(isLegitimateRequest(headers)).toBe(false);
            expect(consoleSpy.warn).toHaveBeenCalledWith(
                expect.stringContaining('[Validation] User-Agent does not match browser patterns'),
                expect.any(Object)
            );
        });

        it('should handle different browser user agents', () => {
            const browserUAs = [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 OPR/77.0.4054.277'
            ];

            browserUAs.forEach(ua => {
                const headers = new Headers({
                    'user-agent': ua,
                    'accept-language': 'en-US,en;q=0.9',
                    'accept-encoding': 'gzip, deflate, br'
                });

                expect(isLegitimateRequest(headers)).toBe(true);
            });
        });

        it('should detect bot and crawler user agents', () => {
            const botUAs = [
                'Googlebot/2.1 (+http://www.google.com/bot.html)',
                'curl/7.68.0',
                'wget/1.20.3',
                'python-requests/2.25.1',
                'Java/1.8.0_281',
                'perl/5.32.0',
                'Ruby/2.7.0',
                'PHP/7.4.0'
            ];

            botUAs.forEach(ua => {
                const headers = new Headers({
                    'user-agent': ua,
                    'accept-language': 'en-US,en;q=0.9',
                    'accept-encoding': 'gzip, deflate, br'
                });

                expect(isLegitimateRequest(headers)).toBe(false);
            });
        });
    });

    describe('Edge cases and security', () => {
        it('should handle extremely long header values', () => {
            const longValue = 'x'.repeat(10000);
            const headers = new Headers({
                'user-agent': longValue
            });

            const result = validateRequestHeaders(headers);
            expect(result.valid).toBe(true);
            expect(result.sanitizedHeaders.has('user-agent')).toBe(false);
        });

        it('should handle headers with null bytes', () => {
            const maliciousValue = 'Mozilla/5.0\x00malicious';
            const headers = new Headers({
                'user-agent': maliciousValue
            });

            const result = validateRequestHeaders(headers);
            expect(result.valid).toBe(true);
            expect(result.sanitizedHeaders.get('user-agent')).toBe('Mozilla/5.0malicious');
        });

        it('should handle headers with control characters', () => {
            const maliciousValue = 'Mozilla/5.0\x01\x02\x03malicious';
            const headers = new Headers({
                'user-agent': maliciousValue
            });

            const result = validateRequestHeaders(headers);
            expect(result.valid).toBe(true);
            expect(result.sanitizedHeaders.get('user-agent')).toBe('Mozilla/5.0malicious');
        });

        it('should handle Unicode and international characters', () => {
            const unicodeValue = 'Mozilla/5.0 (测试)';
            const headers = new Headers({
                'user-agent': unicodeValue
            });

            const result = validateRequestHeaders(headers);
            expect(result.valid).toBe(true);
            expect(result.sanitizedHeaders.get('user-agent')).toBe(unicodeValue);
        });

        it('should handle empty and whitespace-only headers', () => {
            const headers = new Headers({
                'user-agent': '   ',
                'accept-language': '',
                'accept-encoding': '\t\n\r'
            });

            const result = validateRequestHeaders(headers);
            expect(result.valid).toBe(true);
            expect(result.sanitizedHeaders.has('user-agent')).toBe(false);
            expect(result.sanitizedHeaders.has('accept-language')).toBe(false);
            expect(result.sanitizedHeaders.has('accept-encoding')).toBe(false);
        });
    });
});