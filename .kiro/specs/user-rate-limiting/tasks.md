# Implementation Plan

- [x] 1. Set up Vercel KV storage and environment configuration
  - Create Vercel KV database instance
  - Configure environment variables for KV connection
  - Set up local development environment with KV credentials
  - _Requirements: 3.1, 3.2, 6.3_

- [x] 2. Create user identification utilities
  - [x] 2.1 Implement IP address extraction from Vercel headers
    - Write function to extract real IP from X-Forwarded-For and other Vercel headers
    - Handle edge cases with proxy chains and missing headers
    - Create unit tests for IP extraction logic
    - _Requirements: 2.1, 4.1_

  - [x] 2.2 Implement browser fingerprinting service
    - Create function to extract User-Agent, Accept-Language, Accept-Encoding headers
    - Generate consistent fingerprint hash from browser characteristics
    - Write unit tests for fingerprint generation and consistency
    - _Requirements: 2.2, 4.2_

  - [x] 2.3 Create composite user identifier generator
    - Combine IP and fingerprint into SHA-256 hash for user identification
    - Implement fallback to IP-only identification when fingerprinting fails
    - Write unit tests for identifier generation and fallback scenarios
    - _Requirements: 2.3, 4.4_

- [x] 3. Implement rate limiting logic
  - [x] 3.1 Create UTC time calculation utilities
    - Write functions to get current UTC date and time
    - Implement daily reset time calculation (12:00 AM UTC)
    - Implement monthly reset time calculation (1st day of month 12:00 AM UTC)
    - Create unit tests for time calculations and edge cases
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.2 Implement rate limit counter management
    - Create functions to increment daily and monthly counters in KV storage
    - Implement atomic counter operations to prevent race conditions
    - Add TTL settings for automatic cleanup of expired counters
    - Write unit tests for counter operations and TTL behavior
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 3.3 Create rate limit checking logic
    - Implement function to check if user has exceeded daily (3) or monthly (15) limits
    - Calculate remaining requests and reset times for response headers
    - Handle edge cases when counters don't exist (new users)
    - Write unit tests for limit checking and remaining count calculations
    - _Requirements: 1.2, 1.3, 5.1, 5.2_

- [x] 4. Create the /api/random Edge Function
  - [x] 4.1 Set up basic Edge Function structure
    - Create /api/random.ts file with proper Vercel Edge Function exports
    - Implement basic request handling and response structure
    - Add error handling for malformed requests
    - Test basic function deployment and execution
    - _Requirements: 1.1, 6.1_

  - [x] 4.2 Integrate user identification into API endpoint
    - Add user identification logic to extract IP and fingerprint from requests
    - Generate user hash for rate limiting lookups
    - Implement fallback identification when fingerprinting fails
    - Test identification accuracy with various request scenarios
    - _Requirements: 2.1, 2.2, 2.3, 4.4_

  - [x] 4.3 Add rate limiting to API endpoint
    - Integrate rate limit checking before serving data
    - Return 429 status with proper headers when limits exceeded
    - Include rate limit information in all successful responses
    - Test rate limiting behavior with multiple requests
    - _Requirements: 1.2, 1.3, 1.4, 5.1, 5.2_

  - [x] 4.4 Implement server data serving logic
    - Read live_servers.json file from the filesystem
    - Select random server from the available data
    - Return single ServerData object in standardized response format
    - Handle file reading errors and empty data scenarios
    - _Requirements: 1.1, 5.3_

- [ ] 5. Update frontend components to use new API
  - [ ] 5.1 Update ServerStats component
    - Replace direct JSON file fetch with /api/random API call
    - Modify data processing to handle single server response instead of array
    - Add error handling for rate limit responses (429 status)
    - Update loading states and error messages
    - _Requirements: 1.1, 1.4, 5.4_

  - [ ] 5.2 Update Hero component
    - Replace direct JSON file fetch with /api/random API call for initial load
    - Update random button click handler to use /api/random endpoint
    - Remove client-side random selection logic (now handled by API)
    - Add error handling for rate limit responses with user-friendly messages
    - _Requirements: 1.1, 1.4, 5.4_

  - [ ] 5.3 Add rate limit error handling
    - Create reusable error handling for 429 responses
    - Display user-friendly messages when rate limits are exceeded
    - Show remaining quotas and reset times when available
    - Implement retry logic with appropriate delays
    - _Requirements: 1.4, 5.2, 5.3_

- [ ] 6. Add comprehensive error handling and monitoring
  - [ ] 6.1 Implement KV storage error handling
    - Add try-catch blocks around all KV operations
    - Implement graceful degradation when KV is unavailable
    - Log storage errors for monitoring and debugging
    - Test behavior when KV connection fails
    - _Requirements: 3.3, 6.2_

  - [ ] 6.2 Add request validation and sanitization
    - Validate and sanitize all incoming request headers
    - Implement input validation for fingerprint data
    - Add protection against header injection attacks
    - Test with malformed and malicious request headers
    - _Requirements: 4.3, 6.1_

  - [ ] 6.3 Create logging and monitoring
    - Add structured logging for rate limit violations
    - Log suspicious patterns and potential bypass attempts
    - Monitor API response times and error rates
    - Set up alerts for high error rates or storage failures
    - _Requirements: 6.4_

- [ ] 7. Write comprehensive tests
  - [ ] 7.1 Create unit tests for core utilities
    - Test user identification functions with various input scenarios
    - Test rate limiting logic with edge cases and time boundaries
    - Test UTC time calculations across different timezones
    - Achieve high test coverage for all utility functions
    - _Requirements: All requirements validation_

  - [ ] 7.2 Create integration tests for API endpoint
    - Test complete request/response cycle for /api/random endpoint
    - Test rate limiting behavior with sequential requests
    - Test error scenarios including KV failures and invalid data
    - Test concurrent request handling and race conditions
    - _Requirements: All requirements validation_

  - [ ] 7.3 Test frontend integration
    - Test updated components with new API endpoint
    - Test error handling and user experience with rate limits
    - Test loading states and error messages
    - Verify data flow from API to UI components
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 8. Deploy and validate production setup
  - [ ] 8.1 Configure production environment
    - Set up production Vercel KV database
    - Configure production environment variables
    - Deploy Edge Function to Vercel
    - Verify KV connectivity and permissions
    - _Requirements: 6.3, 6.4_

  - [ ] 8.2 Perform end-to-end testing
    - Test rate limiting behavior in production environment
    - Verify UTC time calculations work correctly across edge locations
    - Test with real user scenarios and different browsers
    - Monitor performance and response times
    - _Requirements: All requirements validation_

  - [ ] 8.3 Set up monitoring and alerting
    - Configure monitoring for API endpoint performance
    - Set up alerts for high error rates or rate limit violations
    - Monitor KV storage health and performance
    - Create dashboard for tracking usage patterns
    - _Requirements: 6.4_