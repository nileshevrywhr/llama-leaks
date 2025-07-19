# Design Document

## Overview

This design implements backend-only rate limiting for anonymous users accessing server data through API endpoints. The system will use a combination of IP address and browser fingerprinting to identify users and enforce limits of 3 requests per day and 15 requests per month. The solution is designed specifically for Vercel's serverless environment and focuses on the two main data access points: initial server data load and the "random" button functionality.

## Architecture

### Current System Analysis
- **Frontend**: React SPA deployed on Vercel, fetches data directly from static JSON files
- **Data Source**: Static `/data/live_servers.json` file updated by GitHub Actions
- **Current Data Access**: 
  - Initial load: Direct fetch to `/data/live_servers.json` on page load
  - Random button: Direct re-fetch of the same JSON file, client-side random selection
- **No API Layer**: Currently no backend API endpoints exist

### Proposed Architecture
- **New API Layer**: Create Vercel Edge Functions to serve server data with rate limiting
- **Rate Limiting**: Built into the new API endpoints
- **Storage**: Vercel KV (Redis-compatible) for rate limit counters
- **Identification**: Composite fingerprint using IP + browser characteristics
- **Migration**: Update frontend to use new API endpoints instead of direct file access

## Components and Interfaces

### 1. Rate Limiting Edge Function (`/api/random`)

**Purpose**: Create new API endpoint to serve random server data with built-in rate limiting (replacing direct JSON file access)

**Interface**:
```typescript
// Request
GET /api/random

// Response (Success)
{
  "success": true,
  "data": ServerData, // Always returns a single random server
  "rateLimit": {
    "dailyRemaining": number,
    "monthlyRemaining": number,
    "dailyResetTime": string, // Always 12:00 AM UTC
    "monthlyResetTime": string // Always 1st day of month 12:00 AM UTC
  }
}

// Response (Rate Limited)
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": string,
  "rateLimit": {
    "dailyRemaining": 0,
    "monthlyRemaining": number,
    "dailyResetTime": string,
    "monthlyResetTime": string
  },
  "retryAfter": number // seconds until 12:00 AM UTC
}
```

### 2. User Identification Service

**Purpose**: Generate consistent user identifiers from request data

**Components**:
- **IP Extraction**: Handle Vercel's forwarded headers
- **Fingerprint Generation**: Extract browser characteristics from headers
- **Composite ID**: Combine IP + fingerprint for unique identification

**Fingerprint Data Points**:
- User-Agent string (Note: Changes when user switches browsers)
- Accept-Language header
- Accept-Encoding header
- Screen resolution (if available in custom headers)
- Timezone offset (if available in custom headers)

**Browser Switching Behavior**:
- When a user switches browsers, the User-Agent changes, creating a different fingerprint
- This means each browser gets its own rate limit allowance
- This is an acceptable limitation for preventing abuse while maintaining usability
- Alternative approaches (like device fingerprinting) would be more invasive

### 3. Rate Limit Storage Service

**Purpose**: Manage rate limit counters in Vercel KV

**Storage Schema**:
```typescript
// Daily counter key: `daily:${userHash}:${YYYY-MM-DD}` (UTC date)
// Monthly counter key: `monthly:${userHash}:${YYYY-MM}` (UTC month)

interface RateLimitData {
  count: number;
  firstRequest: string; // ISO timestamp
  lastRequest: string;  // ISO timestamp
}
```

**Reset Time Logic**:
- **Daily Reset**: Always at 12:00 AM UTC (00:00:00 UTC)
- **Monthly Reset**: Always at 12:00 AM UTC on the 1st day of each month
- **Server-Side Time**: All time calculations use server UTC time to prevent client-side manipulation
- **Key Generation**: Date keys are generated server-side using UTC to ensure consistency

### 4. Frontend Integration

**Purpose**: Update existing components to use the new API endpoint

**Changes Required**:
- **ServerStats Component**: Replace direct JSON fetch with `/api/random` call
- **Hero Component**: Update random button to use `/api/random` endpoint
- **Error Handling**: Handle rate limit responses gracefully
- **Data Processing**: Both components will receive single random server instead of full array

## Data Models

### User Identification
```typescript
interface UserIdentifier {
  ip: string;
  fingerprint: string;
  hash: string; // SHA-256 of ip + fingerprint
}

interface FingerprintData {
  userAgent: string;
  acceptLanguage: string;
  acceptEncoding: string;
  screenResolution?: string;
  timezoneOffset?: number;
}
```

### Rate Limit State
```typescript
interface RateLimitState {
  dailyCount: number;
  monthlyCount: number;
  dailyResetTime: Date;
  monthlyResetTime: Date;
  isBlocked: boolean;
  blockType: 'daily' | 'monthly' | null;
}

interface RateLimitResponse {
  allowed: boolean;
  dailyRemaining: number;
  monthlyRemaining: number;
  resetTimes: {
    daily: string;
    monthly: string;
  };
  retryAfter?: number;
}
```

### Server Data Response
```typescript
interface ServerDataResponse {
  success: boolean;
  data?: ServerData; // Always a single random server
  error?: string;
  message?: string;
  rateLimit: {
    dailyRemaining: number;
    monthlyRemaining: number;
    dailyResetTime: string;
    monthlyResetTime: string;
  };
  retryAfter?: number;
}
```

## Error Handling

### Rate Limit Exceeded
- **HTTP Status**: 429 Too Many Requests
- **Response Headers**: 
  - `Retry-After`: Seconds until next allowed request
  - `X-RateLimit-Limit-Daily`: 3
  - `X-RateLimit-Limit-Monthly`: 15
  - `X-RateLimit-Remaining-Daily`: 0
  - `X-RateLimit-Remaining-Monthly`: remaining count

### Storage Failures
- **Fallback Strategy**: Allow request but log error
- **Monitoring**: Track storage failures for alerting
- **Graceful Degradation**: Continue serving data when KV is unavailable

### Identification Failures
- **Fallback**: Use IP-only identification
- **Logging**: Track fingerprinting failures
- **Security**: Apply most restrictive limits when identification is uncertain

## Testing Strategy

### Unit Tests
- **User Identification**: Test fingerprint generation and hashing
- **Rate Limit Logic**: Test counter increment and limit checking
- **Time Calculations**: Test daily/monthly reset logic
- **Error Handling**: Test all failure scenarios

### Integration Tests
- **API Endpoint**: Test complete request/response cycle
- **Storage Integration**: Test KV operations
- **Frontend Integration**: Test component updates

### Load Testing
- **Concurrent Requests**: Test race conditions in counter updates
- **Storage Performance**: Test KV response times under load
- **Edge Function Performance**: Test cold start and execution times

### Security Testing
- **Bypass Attempts**: Test various fingerprint manipulation attempts
- **IP Spoofing**: Test with various proxy configurations
- **Rate Limit Accuracy**: Verify limits are enforced correctly

## Implementation Phases

### Phase 1: Backend Rate Limiting (Current Scope)
1. Create Vercel Edge Function for `/api/random`
2. Implement user identification service
3. Set up Vercel KV storage
4. Update frontend components to use new API
5. Add error handling and monitoring

### Phase 2: Client-Side UI Enhancement (Future)
1. Add rate limit status display
2. Implement localStorage caching
3. Show countdown timers for reset times
4. Add user-friendly error messages
5. Implement progressive enhancement

## Security Considerations

### Bypass Prevention
- **Multiple Identification**: IP + fingerprint combination
- **Server-Side Storage**: All counters stored in Vercel KV
- **Atomic Operations**: Use KV transactions for counter updates
- **Header Validation**: Sanitize and validate all input headers

### Privacy Protection
- **Hash User IDs**: Never store raw IP addresses or fingerprints
- **Data Retention**: Automatically expire old rate limit data
- **Minimal Data**: Only collect necessary identification data

### Monitoring and Alerting
- **Rate Limit Violations**: Track and alert on suspicious patterns
- **Storage Health**: Monitor KV performance and availability
- **Error Rates**: Track and alert on high error rates

## Vercel-Specific Considerations

### Edge Functions
- **Cold Start Optimization**: Minimize initialization time
- **Memory Limits**: Keep fingerprint data structures lightweight
- **Execution Time**: Ensure sub-second response times

### KV Storage
- **Connection Pooling**: Reuse KV connections efficiently
- **Error Handling**: Handle KV timeouts and failures gracefully
- **Data Expiration**: Use TTL for automatic cleanup

### Deployment
- **Environment Variables**: Secure KV credentials
- **Edge Locations**: Ensure consistent behavior across regions
- **Rollback Strategy**: Plan for quick rollback if issues arise