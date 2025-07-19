# Requirements Document

## Introduction

This feature implements backend rate limiting for anonymous users to prevent abuse and ensure fair usage of the server scanning service. The system will enforce strict limits of 3 requests per day and 15 requests per month per anonymous user using fingerprint+IP identification for the API endpoints that serve server data (initial load and "random" button clicks). A future phase will add client-side UI with localStorage to display remaining allowances and cooldowns.

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to enforce rate limits on anonymous user requests, so that the service remains available and fair for all users while preventing abuse without requiring authentication.

#### Acceptance Criteria

1. WHEN an anonymous user makes a request THEN the system SHALL check both daily and monthly rate limits before processing
2. WHEN an anonymous user exceeds 3 requests in a 24-hour period THEN the system SHALL reject the request with a 429 status code
3. WHEN an anonymous user exceeds 15 requests in a 30-day period THEN the system SHALL reject the request with a 429 status code
4. WHEN rate limits are exceeded THEN the system SHALL return clear error messages indicating the limit type and reset time

### Requirement 2

**User Story:** As a system administrator, I want to identify users through fingerprint+IP combination, so that rate limits are applied consistently to the same user across sessions.

#### Acceptance Criteria

1. WHEN a request is made to server data API endpoints THEN the system SHALL generate a user identifier from IP address and browser fingerprint
2. WHEN the same fingerprint+IP combination makes requests THEN the system SHALL apply shared rate limiting
3. WHEN either IP or fingerprint changes THEN the system SHALL treat it as a potentially different user
4. WHEN fingerprint generation fails THEN the system SHALL fall back to IP-only identification

### Requirement 3

**User Story:** As a system administrator, I want to implement server-side rate limiting storage, so that limits cannot be bypassed through client-side manipulation.

#### Acceptance Criteria

1. WHEN rate limit data is stored THEN the system SHALL use server-side persistent storage (database or external service)
2. WHEN a user attempts to manipulate client-side data THEN the system SHALL ignore client-side rate limit information
3. WHEN the application restarts or redeploys THEN the system SHALL maintain existing rate limit counters
4. WHEN rate limit data is accessed THEN the system SHALL ensure atomic operations to prevent race conditions

### Requirement 4

**User Story:** As a system administrator, I want to apply rate limiting to specific API endpoints, so that only the server data requests are controlled while other static content remains unrestricted.

#### Acceptance Criteria

1. WHEN a request is made to server data API endpoints (initial load, random button) THEN the system SHALL apply rate limiting
2. WHEN a request is made to static assets or non-data endpoints THEN the system SHALL NOT apply rate limiting
3. WHEN the API endpoints are called THEN the system SHALL extract fingerprint data from request headers
4. WHEN rate limiting is applied THEN the system SHALL target only the endpoints that serve dynamic server data

### Requirement 5

**User Story:** As a user, I want to see my current rate limit status, so that I can understand my usage and plan accordingly.

#### Acceptance Criteria

1. WHEN a user makes a successful request THEN the system SHALL return headers indicating remaining daily and monthly limits
2. WHEN a user is rate limited THEN the system SHALL provide clear information about when limits reset
3. WHEN a user checks their status THEN the system SHALL display current usage counts and remaining quotas
4. WHEN limits are approaching THEN the system SHALL provide warnings in response headers

### Requirement 6

**User Story:** As a system administrator, I want the rate limiting to work seamlessly with Vercel deployment, so that the system is production-ready and scalable.

#### Acceptance Criteria

1. WHEN deployed on Vercel THEN the system SHALL handle serverless function limitations and cold starts
2. WHEN using Vercel's edge network THEN the system SHALL maintain consistent rate limiting across all edge locations
3. WHEN scaling occurs THEN the system SHALL maintain rate limit accuracy without data loss
4. WHEN using external storage THEN the system SHALL handle connection failures gracefully with appropriate fallbacks