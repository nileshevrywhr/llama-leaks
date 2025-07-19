#!/usr/bin/env node

// Simple script to test KV connection
// Run with: node scripts/test-kv.js

import { config } from 'dotenv';
import { kv } from '@vercel/kv';

// Load environment variables
config({ path: '.env.local' });

async function testKVSetup() {
  console.log('Testing Vercel KV setup...\n');

  // Check environment variables
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  console.log('Environment Variables:');
  console.log('KV_REST_API_URL:', kvUrl ? '✓ Set' : '✗ Missing');
  console.log('KV_REST_API_TOKEN:', kvToken ? '✓ Set' : '✗ Missing');

  if (!kvUrl || !kvToken) {
    console.log('\n❌ KV environment variables are missing.');
    console.log('Please check your .env.local file and KV_SETUP.md for instructions.');
    process.exit(1);
  }

  if (kvUrl.includes('your-kv-database-url') || kvToken.includes('your-kv-rest-api-token')) {
    console.log('\n⚠️  KV environment variables contain placeholder values.');
    console.log('Please replace them with actual values from your Vercel KV database.');
    process.exit(1);
  }

  // Test connection
  try {
    console.log('\nTesting KV connection...');

    const testKey = `test:${Date.now()}`;
    const testValue = 'connection-test';

    // Set a test value
    await kv.set(testKey, testValue, { ex: 10 });
    console.log('✓ Set test value');

    // Get the test value
    const result = await kv.get(testKey);
    console.log('✓ Retrieved test value');

    // Verify the value
    if (result === testValue) {
      console.log('✓ Value verification passed');
    } else {
      throw new Error(`Value mismatch: expected "${testValue}", got "${result}"`);
    }

    // Clean up
    await kv.del(testKey);
    console.log('✓ Cleaned up test data');

    console.log('\n🎉 KV setup is working correctly!');

  } catch (error) {
    console.log('\n❌ KV connection failed:');
    console.error(error.message);
    console.log('\nPlease check:');
    console.log('1. Your KV database is created and active');
    console.log('2. Environment variables are correct');
    console.log('3. Your network connection');
    process.exit(1);
  }
}

testKVSetup();