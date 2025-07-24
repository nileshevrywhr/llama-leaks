#!/usr/bin/env node

/**
 * Preview/Production Verification Script for Rate Limiting System
 * This script tests the deployed API endpoints to ensure they're working correctly
 */

const DEPLOYMENT_URL = process.env.VERCEL_URL || process.env.DEPLOYMENT_URL || 'llama-leaks-qsbxen9y4-yellow-ops.vercel.app';
const BASE_URL = DEPLOYMENT_URL.startsWith('http') ? DEPLOYMENT_URL : `https://${DEPLOYMENT_URL}`;

async function makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n🔍 Testing: ${url}`);

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'User-Agent': 'Production-Verification-Script/1.0',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                ...options.headers
            }
        });

        const data = await response.json();

        console.log(`✅ Status: ${response.status}`);
        console.log(`📊 Response:`, JSON.stringify(data, null, 2));

        // Check rate limit headers
        const rateLimitHeaders = {};
        for (const [key, value] of response.headers.entries()) {
            if (key.toLowerCase().includes('ratelimit') || key.toLowerCase().includes('retry')) {
                rateLimitHeaders[key] = value;
            }
        }

        if (Object.keys(rateLimitHeaders).length > 0) {
            console.log(`🚦 Rate Limit Headers:`, rateLimitHeaders);
        }

        return { response, data };

    } catch (error) {
        console.error(`❌ Error testing ${endpoint}:`, error.message);
        return { error };
    }
}

async function testStatsEndpoint() {
    console.log('\n=== Testing /api/stats endpoint ===');

    const result = await makeRequest('/api/stats');

    if (result.error) {
        console.error('❌ Stats endpoint failed');
        return false;
    }

    const { response, data } = result;

    if (response.status !== 200) {
        console.error(`❌ Expected status 200, got ${response.status}`);
        return false;
    }

    if (!data.success) {
        console.error('❌ Response indicates failure');
        return false;
    }

    if (!data.statistics) {
        console.error('❌ Missing statistics in response');
        return false;
    }

    const requiredFields = ['totalServers', 'liveServers', 'newToday', 'latestFindMinutes'];
    for (const field of requiredFields) {
        if (typeof data.statistics[field] !== 'number') {
            console.error(`❌ Missing or invalid field: ${field}`);
            return false;
        }
    }

    console.log('✅ Stats endpoint working correctly');
    return true;
}

async function testRandomEndpoint() {
    console.log('\n=== Testing /api/random endpoint ===');

    const result = await makeRequest('/api/random');

    if (result.error) {
        console.error('❌ Random endpoint failed');
        return false;
    }

    const { response, data } = result;

    if (response.status !== 200) {
        console.error(`❌ Expected status 200, got ${response.status}`);
        return false;
    }

    if (!data.success) {
        console.error('❌ Response indicates failure');
        return false;
    }

    if (!data.data) {
        console.error('❌ Missing server data in response');
        return false;
    }

    if (!data.rateLimit) {
        console.error('❌ Missing rate limit info in response');
        return false;
    }

    const requiredRateLimitFields = ['dailyRemaining', 'monthlyRemaining', 'dailyResetTime', 'monthlyResetTime'];
    for (const field of requiredRateLimitFields) {
        if (data.rateLimit[field] === undefined) {
            console.error(`❌ Missing rate limit field: ${field}`);
            return false;
        }
    }

    console.log('✅ Random endpoint working correctly');
    return true;
}

async function testRateLimiting() {
    console.log('\n=== Testing Rate Limiting Behavior ===');

    let successCount = 0;
    let rateLimitHit = false;

    // Make multiple requests to test rate limiting
    for (let i = 1; i <= 5; i++) {
        console.log(`\n📞 Request ${i}/5`);

        const result = await makeRequest('/api/random');

        if (result.error) {
            console.error(`❌ Request ${i} failed with error`);
            continue;
        }

        const { response, data } = result;

        if (response.status === 200) {
            successCount++;
            console.log(`✅ Request ${i} successful (${data.rateLimit.dailyRemaining} daily remaining)`);
        } else if (response.status === 429) {
            rateLimitHit = true;
            console.log(`🚦 Request ${i} rate limited (${data.error})`);
            console.log(`⏰ Retry after: ${data.retryAfter} seconds`);
            break;
        } else {
            console.error(`❌ Request ${i} failed with status ${response.status}`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n📊 Rate Limiting Test Results:`);
    console.log(`   Successful requests: ${successCount}`);
    console.log(`   Rate limit triggered: ${rateLimitHit ? 'Yes' : 'No'}`);

    if (successCount > 0) {
        console.log('✅ Rate limiting system is functional');
        return true;
    } else {
        console.error('❌ No successful requests - rate limiting may be too strict');
        return false;
    }
}

async function testInvalidMethods() {
    console.log('\n=== Testing Invalid HTTP Methods ===');

    const endpoints = ['/api/random', '/api/stats'];
    const methods = ['POST', 'PUT', 'DELETE'];

    let allCorrect = true;

    for (const endpoint of endpoints) {
        for (const method of methods) {
            const result = await makeRequest(endpoint, { method });

            if (result.error) {
                console.error(`❌ ${method} ${endpoint} failed with error`);
                allCorrect = false;
                continue;
            }

            const { response } = result;

            if (response.status === 405) {
                console.log(`✅ ${method} ${endpoint} correctly rejected (405)`);
            } else {
                console.error(`❌ ${method} ${endpoint} should return 405, got ${response.status}`);
                allCorrect = false;
            }
        }
    }

    return allCorrect;
}

async function main() {
    console.log('🚀 Starting Production Verification Tests');
    console.log(`🌐 Testing URL: ${BASE_URL}`);

    if (!DEPLOYMENT_URL || DEPLOYMENT_URL.includes('your-deployment-url')) {
        console.error('❌ Please set VERCEL_URL or DEPLOYMENT_URL environment variable or update DEPLOYMENT_URL in script');
        process.exit(1);
    }

    const tests = [
        { name: 'Stats Endpoint', fn: testStatsEndpoint },
        { name: 'Random Endpoint', fn: testRandomEndpoint },
        { name: 'Rate Limiting', fn: testRateLimiting },
        { name: 'Invalid Methods', fn: testInvalidMethods }
    ];

    const results = [];

    for (const test of tests) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`🧪 Running: ${test.name}`);
        console.log(`${'='.repeat(50)}`);

        try {
            const result = await test.fn();
            results.push({ name: test.name, passed: result });
        } catch (error) {
            console.error(`❌ Test "${test.name}" threw an error:`, error.message);
            results.push({ name: test.name, passed: false });
        }
    }

    // Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log('📋 TEST SUMMARY');
    console.log(`${'='.repeat(50)}`);

    let passedCount = 0;
    for (const result of results) {
        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${result.name}`);
        if (result.passed) passedCount++;
    }

    console.log(`\n📊 Overall: ${passedCount}/${results.length} tests passed`);

    if (passedCount === results.length) {
        console.log('🎉 All tests passed! Production deployment is working correctly.');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Please check the issues above.');
        process.exit(1);
    }
}

// Run the verification
main().catch(error => {
    console.error('💥 Verification script crashed:', error);
    process.exit(1);
});