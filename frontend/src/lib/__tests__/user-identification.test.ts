import { describe, it, expect } from 'vitest'
import {
    extractIPFromHeaders,
    extractFingerprintFromHeaders,
    generateFingerprintHash,
    isValidFingerprint,
    createBrowserFingerprint,
    generateUserIdentifier,
    createUserIdentifierFromHeaders,
    isValidUserIdentifier
} from '../user-identification'

describe('extractIPFromHeaders', () => {
    it('should extract IP from X-Forwarded-For header (single IP)', () => {
        const headers = new Headers({
            'x-forwarded-for': '192.168.1.100'
        })

        expect(extractIPFromHeaders(headers)).toBe('192.168.1.100')
    })

    it('should extract first IP from X-Forwarded-For header (multiple IPs)', () => {
        const headers = new Headers({
            'x-forwarded-for': '192.168.1.100, 10.0.0.1, 172.16.0.1'
        })

        expect(extractIPFromHeaders(headers)).toBe('192.168.1.100')
    })

    it('should handle X-Forwarded-For with spaces around IPs', () => {
        const headers = new Headers({
            'x-forwarded-for': ' 192.168.1.100 , 10.0.0.1 , 172.16.0.1 '
        })

        expect(extractIPFromHeaders(headers)).toBe('192.168.1.100')
    })

    it('should fallback to X-Real-IP when X-Forwarded-For is invalid', () => {
        const headers = new Headers({
            'x-forwarded-for': 'invalid-ip',
            'x-real-ip': '192.168.1.200'
        })

        expect(extractIPFromHeaders(headers)).toBe('192.168.1.200')
    })

    it('should fallback to X-Client-IP when other headers are missing', () => {
        const headers = new Headers({
            'x-client-ip': '192.168.1.300'
        })

        expect(extractIPFromHeaders(headers)).toBe('192.168.1.300')
    })

    it('should fallback to CF-Connecting-IP when other headers are missing', () => {
        const headers = new Headers({
            'cf-connecting-ip': '192.168.1.400'
        })

        expect(extractIPFromHeaders(headers)).toBe('192.168.1.400')
    })

    it('should handle IPv6 addresses', () => {
        const headers = new Headers({
            'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
        })

        expect(extractIPFromHeaders(headers)).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
    })

    it('should handle compressed IPv6 addresses', () => {
        const headers = new Headers({
            'x-forwarded-for': '2001:db8::1'
        })

        expect(extractIPFromHeaders(headers)).toBe('2001:db8::1')
    })

    it('should handle localhost IPv6', () => {
        const headers = new Headers({
            'x-forwarded-for': '::1'
        })

        expect(extractIPFromHeaders(headers)).toBe('::1')
    })

    it('should return fallback IP when no valid headers are present', () => {
        const headers = new Headers({})

        expect(extractIPFromHeaders(headers)).toBe('0.0.0.0')
    })

    it('should return fallback IP when all headers contain invalid IPs', () => {
        const headers = new Headers({
            'x-forwarded-for': 'not-an-ip',
            'x-real-ip': 'also-not-an-ip',
            'x-client-ip': 'definitely-not-an-ip'
        })

        expect(extractIPFromHeaders(headers)).toBe('0.0.0.0')
    })

    it('should prioritize X-Forwarded-For over other headers', () => {
        const headers = new Headers({
            'x-forwarded-for': '192.168.1.100',
            'x-real-ip': '192.168.1.200',
            'x-client-ip': '192.168.1.300'
        })

        expect(extractIPFromHeaders(headers)).toBe('192.168.1.100')
    })

    it('should handle edge case with empty X-Forwarded-For', () => {
        const headers = new Headers({
            'x-forwarded-for': '',
            'x-real-ip': '192.168.1.200'
        })

        expect(extractIPFromHeaders(headers)).toBe('192.168.1.200')
    })

    it('should handle edge case with only commas in X-Forwarded-For', () => {
        const headers = new Headers({
            'x-forwarded-for': ', , ,',
            'x-real-ip': '192.168.1.200'
        })

        expect(extractIPFromHeaders(headers)).toBe('192.168.1.200')
    })

    it('should validate IP addresses properly', () => {
        const headers = new Headers({
            'x-forwarded-for': '999.999.999.999', // Invalid IPv4
            'x-real-ip': '192.168.1.200'
        })

        expect(extractIPFromHeaders(headers)).toBe('192.168.1.200')
    })
})

describe('extractFingerprintFromHeaders', () => {
    it('should extract basic fingerprint data from headers', () => {
        const headers = new Headers({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br'
        })

        const fingerprint = extractFingerprintFromHeaders(headers)

        expect(fingerprint.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        expect(fingerprint.acceptLanguage).toBe('en-US,en;q=0.9')
        expect(fingerprint.acceptEncoding).toBe('gzip, deflate, br')
        expect(fingerprint.screenResolution).toBeUndefined()
        expect(fingerprint.timezoneOffset).toBeUndefined()
    })

    it('should extract optional fingerprint data when present', () => {
        const headers = new Headers({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br',
            'x-screen-resolution': '1920x1080',
            'x-timezone-offset': '-300'
        })

        const fingerprint = extractFingerprintFromHeaders(headers)

        expect(fingerprint.screenResolution).toBe('1920x1080')
        expect(fingerprint.timezoneOffset).toBe(-300)
    })

    it('should handle missing headers gracefully', () => {
        const headers = new Headers({})

        const fingerprint = extractFingerprintFromHeaders(headers)

        expect(fingerprint.userAgent).toBe('')
        expect(fingerprint.acceptLanguage).toBe('')
        expect(fingerprint.acceptEncoding).toBe('')
        expect(fingerprint.screenResolution).toBeUndefined()
        expect(fingerprint.timezoneOffset).toBeUndefined()
    })

    it('should handle invalid timezone offset', () => {
        const headers = new Headers({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'x-timezone-offset': 'invalid-number'
        })

        const fingerprint = extractFingerprintFromHeaders(headers)

        expect(fingerprint.timezoneOffset).toBeUndefined()
    })
})

describe('generateFingerprintHash', () => {
    it('should generate consistent hash for same fingerprint data', () => {
        const fingerprintData = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            acceptLanguage: 'en-US,en;q=0.9',
            acceptEncoding: 'gzip, deflate, br'
        }

        const hash1 = generateFingerprintHash(fingerprintData)
        const hash2 = generateFingerprintHash(fingerprintData)

        expect(hash1).toBe(hash2)
        expect(hash1).toBeTruthy()
        expect(typeof hash1).toBe('string')
    })

    it('should generate different hashes for different fingerprint data', () => {
        const fingerprintData1 = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            acceptLanguage: 'en-US,en;q=0.9',
            acceptEncoding: 'gzip, deflate, br'
        }

        const fingerprintData2 = {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            acceptLanguage: 'en-US,en;q=0.9',
            acceptEncoding: 'gzip, deflate, br'
        }

        const hash1 = generateFingerprintHash(fingerprintData1)
        const hash2 = generateFingerprintHash(fingerprintData2)

        expect(hash1).not.toBe(hash2)
    })

    it('should include optional fields in hash generation', () => {
        const fingerprintData1 = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            acceptLanguage: 'en-US,en;q=0.9',
            acceptEncoding: 'gzip, deflate, br'
        }

        const fingerprintData2 = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            acceptLanguage: 'en-US,en;q=0.9',
            acceptEncoding: 'gzip, deflate, br',
            screenResolution: '1920x1080',
            timezoneOffset: -300
        }

        const hash1 = generateFingerprintHash(fingerprintData1)
        const hash2 = generateFingerprintHash(fingerprintData2)

        expect(hash1).not.toBe(hash2)
    })
})

describe('isValidFingerprint', () => {
    it('should return true for valid fingerprint with Mozilla user agent', () => {
        const fingerprintData = {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            acceptLanguage: 'en-US,en;q=0.9',
            acceptEncoding: 'gzip, deflate, br'
        }

        expect(isValidFingerprint(fingerprintData)).toBe(true)
    })

    it('should return true for valid fingerprint with Chrome user agent', () => {
        const fingerprintData = {
            userAgent: 'Chrome/91.0.4472.124 Safari/537.36',
            acceptLanguage: 'en-US,en;q=0.9',
            acceptEncoding: 'gzip, deflate, br'
        }

        expect(isValidFingerprint(fingerprintData)).toBe(true)
    })

    it('should return false for empty user agent', () => {
        const fingerprintData = {
            userAgent: '',
            acceptLanguage: 'en-US,en;q=0.9',
            acceptEncoding: 'gzip, deflate, br'
        }

        expect(isValidFingerprint(fingerprintData)).toBe(false)
    })

    it('should return false for invalid user agent', () => {
        const fingerprintData = {
            userAgent: 'CustomBot/1.0',
            acceptLanguage: 'en-US,en;q=0.9',
            acceptEncoding: 'gzip, deflate, br'
        }

        expect(isValidFingerprint(fingerprintData)).toBe(false)
    })

    it('should return false for whitespace-only user agent', () => {
        const fingerprintData = {
            userAgent: '   ',
            acceptLanguage: 'en-US,en;q=0.9',
            acceptEncoding: 'gzip, deflate, br'
        }

        expect(isValidFingerprint(fingerprintData)).toBe(false)
    })
})

describe('createBrowserFingerprint', () => {
    it('should create fingerprint hash for valid headers', () => {
        const headers = new Headers({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br'
        })

        const fingerprint = createBrowserFingerprint(headers)

        expect(fingerprint).toBeTruthy()
        expect(typeof fingerprint).toBe('string')
    })

    it('should return null for invalid user agent', () => {
        const headers = new Headers({
            'user-agent': 'CustomBot/1.0',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br'
        })

        const fingerprint = createBrowserFingerprint(headers)

        expect(fingerprint).toBeNull()
    })

    it('should return null for missing user agent', () => {
        const headers = new Headers({
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br'
        })

        const fingerprint = createBrowserFingerprint(headers)

        expect(fingerprint).toBeNull()
    })

    it('should create consistent fingerprints for same headers', () => {
        const headers = new Headers({
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br'
        })

        const fingerprint1 = createBrowserFingerprint(headers)
        const fingerprint2 = createBrowserFingerprint(headers)

        expect(fingerprint1).toBe(fingerprint2)
    })
})d
escribe('generateUserIdentifier', () => {
    it('should generate identifier with both IP and fingerprint', () => {
        const ip = '192.168.1.100';
        const fingerprint = 'abc123def456';

        const identifier = generateUserIdentifier(ip, fingerprint);

        expect(identifier.ip).toBe(ip);
        expect(identifier.fingerprint).toBe(fingerprint);
        expect(identifier.hash).toBeTruthy();
        expect(typeof identifier.hash).toBe('string');
    });

    it('should generate identifier with IP only when fingerprint is null', () => {
        const ip = '192.168.1.100';
        const fingerprint = null;

        const identifier = generateUserIdentifier(ip, fingerprint);

        expect(identifier.ip).toBe(ip);
        expect(identifier.fingerprint).toBeNull();
        expect(identifier.hash).toBeTruthy();
        expect(typeof identifier.hash).toBe('string');
    });

    it('should generate different hashes for different IPs', () => {
        const fingerprint = 'abc123def456';

        const identifier1 = generateUserIdentifier('192.168.1.100', fingerprint);
        const identifier2 = generateUserIdentifier('192.168.1.200', fingerprint);

        expect(identifier1.hash).not.toBe(identifier2.hash);
    });

    it('should generate different hashes for different fingerprints', () => {
        const ip = '192.168.1.100';

        const identifier1 = generateUserIdentifier(ip, 'fingerprint1');
        const identifier2 = generateUserIdentifier(ip, 'fingerprint2');

        expect(identifier1.hash).not.toBe(identifier2.hash);
    });

    it('should generate different hashes for fingerprint vs no fingerprint', () => {
        const ip = '192.168.1.100';

        const identifier1 = generateUserIdentifier(ip, 'fingerprint1');
        const identifier2 = generateUserIdentifier(ip, null);

        expect(identifier1.hash).not.toBe(identifier2.hash);
    });

    it('should generate consistent hashes for same input', () => {
        const ip = '192.168.1.100';
        const fingerprint = 'abc123def456';

        const identifier1 = generateUserIdentifier(ip, fingerprint);
        const identifier2 = generateUserIdentifier(ip, fingerprint);

        expect(identifier1.hash).toBe(identifier2.hash);
    });
});

describe('createUserIdentifierFromHeaders', () => {
    it('should create identifier with valid IP and fingerprint', () => {
        const headers = new Headers({
            'x-forwarded-for': '192.168.1.100',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br'
        });

        const identifier = createUserIdentifierFromHeaders(headers);

        expect(identifier.ip).toBe('192.168.1.100');
        expect(identifier.fingerprint).toBeTruthy();
        expect(identifier.hash).toBeTruthy();
    });

    it('should fallback to IP-only when fingerprinting fails', () => {
        const headers = new Headers({
            'x-forwarded-for': '192.168.1.100',
            'user-agent': 'CustomBot/1.0', // Invalid user agent
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br'
        });

        const identifier = createUserIdentifierFromHeaders(headers);

        expect(identifier.ip).toBe('192.168.1.100');
        expect(identifier.fingerprint).toBeNull();
        expect(identifier.hash).toBeTruthy();
    });

    it('should handle missing headers gracefully', () => {
        const headers = new Headers({});

        const identifier = createUserIdentifierFromHeaders(headers);

        expect(identifier.ip).toBe('0.0.0.0'); // Fallback IP
        expect(identifier.fingerprint).toBeNull();
        expect(identifier.hash).toBeTruthy();
    });

    it('should create consistent identifiers for same headers', () => {
        const headers = new Headers({
            'x-forwarded-for': '192.168.1.100',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept-language': 'en-US,en;q=0.9',
            'accept-encoding': 'gzip, deflate, br'
        });

        const identifier1 = createUserIdentifierFromHeaders(headers);
        const identifier2 = createUserIdentifierFromHeaders(headers);

        expect(identifier1.hash).toBe(identifier2.hash);
    });
});

describe('isValidUserIdentifier', () => {
    it('should return true for valid identifier with fingerprint', () => {
        const identifier = {
            ip: '192.168.1.100',
            fingerprint: 'abc123def456',
            hash: 'somehash123'
        };

        expect(isValidUserIdentifier(identifier)).toBe(true);
    });

    it('should return true for valid identifier without fingerprint', () => {
        const identifier = {
            ip: '192.168.1.100',
            fingerprint: null,
            hash: 'somehash123'
        };

        expect(isValidUserIdentifier(identifier)).toBe(true);
    });

    it('should return false for fallback IP address', () => {
        const identifier = {
            ip: '0.0.0.0',
            fingerprint: 'abc123def456',
            hash: 'somehash123'
        };

        expect(isValidUserIdentifier(identifier)).toBe(false);
    });

    it('should return false for empty IP', () => {
        const identifier = {
            ip: '',
            fingerprint: 'abc123def456',
            hash: 'somehash123'
        };

        expect(isValidUserIdentifier(identifier)).toBe(false);
    });

    it('should return false for empty hash', () => {
        const identifier = {
            ip: '192.168.1.100',
            fingerprint: 'abc123def456',
            hash: ''
        };

        expect(isValidUserIdentifier(identifier)).toBe(false);
    });

    it('should return false for missing hash', () => {
        const identifier = {
            ip: '192.168.1.100',
            fingerprint: 'abc123def456',
            hash: null as any
        };

        expect(isValidUserIdentifier(identifier)).toBe(false);
    });
});