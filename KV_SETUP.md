# Vercel KV Setup Guide

This guide explains how to set up Vercel KV for the rate limiting feature.

## Prerequisites

- Vercel account
- Project deployed on Vercel (or linked to Vercel)

## Step 1: Create Vercel KV Database

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the "Storage" tab
3. Click "Create Database"
4. Select "KV" (Key-Value store)
5. Choose a name for your database (e.g., `user-rate-limiting-kv`)
6. Select the region closest to your users
7. Click "Create"

## Step 2: Get KV Credentials

After creating the KV database:

1. Go to your KV database dashboard
2. Click on the "Settings" tab
3. Copy the following environment variables:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

## Step 3: Configure Environment Variables

### For Local Development

1. Update `frontend/.env.local` with your actual KV credentials:
```bash
# Replace the placeholder values with your actual KV credentials
KV_REST_API_URL=https://your-actual-kv-url.kv.vercel-storage.com
KV_REST_API_TOKEN=your-actual-kv-token
```

### For Production (Vercel Deployment)

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add the following variables:
   - `KV_REST_API_URL`: Your KV REST API URL
   - `KV_REST_API_TOKEN`: Your KV REST API Token
4. Make sure to set them for "Production", "Preview", and "Development" environments

## Step 4: Link KV Database to Project

1. In your Vercel project dashboard, go to "Storage"
2. Click "Connect Store"
3. Select your KV database
4. This will automatically add the environment variables to your project

## Step 5: Test Connection

You can test the KV connection by running the test function:

```typescript
import { testKVConnection } from './src/lib/kv';

// Test KV connection
testKVConnection().then(success => {
  console.log('KV Connection:', success ? 'Success' : 'Failed');
});
```

## Troubleshooting

### Common Issues

1. **Environment variables not found**
   - Make sure you've added the KV environment variables to both local `.env.local` and Vercel project settings

2. **Connection timeout**
   - Check if your KV database region is appropriate for your deployment region
   - Verify the KV_REST_API_URL is correct

3. **Authentication errors**
   - Verify the KV_REST_API_TOKEN is correct and hasn't expired
   - Make sure the token has the necessary permissions

### Development vs Production

- **Development**: Uses `.env.local` file
- **Production**: Uses Vercel environment variables
- The KV utility automatically handles environment validation

## Security Notes

- Never commit actual KV credentials to version control
- Use different KV databases for development and production if possible
- Regularly rotate your KV tokens for security
- Monitor KV usage to detect any unusual patterns

## Rate Limiting Schema

The rate limiting system uses the following KV key patterns:

- Daily counters: `daily:{userHash}:{YYYY-MM-DD}`
- Monthly counters: `monthly:{userHash}:{YYYY-MM}`

Keys automatically expire based on their reset times to keep storage clean.