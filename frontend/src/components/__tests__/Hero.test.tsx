/**
 * Integration tests for Hero component with new API endpoint
 * Tests the updated component behavior with rate limiting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Hero from '../Hero';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods to avoid noise in tests
const consoleSpy = {
    error: vi.spyOn(console, 'error').mockImplementation(() => { }),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => { })
};

// Mock server data response
const mockServerData = {
    id: '1',
    ip: '192.168.1.100',
    port: 8080,
    version: '1.0.0',
    status: 'online',
    lastSeen: '2024-03-15T14:30:00.000Z'
};

const mockSuccessResponse = {
    success: true,
    data: mockServerData,
    rateLimit: {
        dailyRemaining: 2,
        monthlyRemaining: 14,
        dailyResetTime: '2024-03-16T00:00:00.000Z',
        monthlyResetTime: '2024-04-01T00:00:00.000Z'
    }
};

const mockRateLimitResponse = {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Daily rate limit exceeded. You have made 3 requests today. Limit resets at 12:00 AM UTC.',
    rateLimit: {
        dailyRemaining: 0,
        monthlyRemaining: 10,
        dailyResetTime: '2024-03-16T00:00:00.000Z',
        monthlyResetTime: '2024-04-01T00:00:00.000Z'
    },
    retryAfter: 3600
};

// Wrapper component for testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
        {children}
    </BrowserRouter>
);

describe('Hero Component Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.values(consoleSpy).forEach(spy => spy.mockClear());
        mockFetch.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Initial load with API endpoint', () => {
        it('should load random server data on component mount', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse,
                headers: new Headers({
                    'X-RateLimit-Remaining-Daily': '2',
                    'X-RateLimit-Remaining-Monthly': '14'
                })
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            // Wait for the API call to complete
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/random', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            });

            // Check that server data is displayed
            await waitFor(() => {
                expect(screen.getByText('192.168.1.100:8080')).toBeInTheDocument();
            });
        });

        it('should handle API errors gracefully on initial load', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/random');
            });

            // Should show error message or fallback content
            await waitFor(() => {
                expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument();
            });
        });

        it('should display rate limit information', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse,
                headers: new Headers({
                    'X-RateLimit-Remaining-Daily': '2',
                    'X-RateLimit-Remaining-Monthly': '14'
                })
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/2.*remaining.*today/i)).toBeInTheDocument();
                expect(screen.getByText(/14.*remaining.*month/i)).toBeInTheDocument();
            });
        });
    });

    describe('Random button functionality', () => {
        it('should fetch new server data when random button is clicked', async () => {
            // Initial load
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            // Click random button
            const randomButton = screen.getByRole('button', { name: /random/i });

            // Mock second API call
            const secondServerData = {
                ...mockServerData,
                id: '2',
                ip: '192.168.1.101'
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    ...mockSuccessResponse,
                    data: secondServerData,
                    rateLimit: {
                        ...mockSuccessResponse.rateLimit,
                        dailyRemaining: 1,
                        monthlyRemaining: 13
                    }
                })
            });

            fireEvent.click(randomButton);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });

            // Should display new server data
            await waitFor(() => {
                expect(screen.getByText('192.168.1.101:8080')).toBeInTheDocument();
            });

            // Should update rate limit display
            await waitFor(() => {
                expect(screen.getByText(/1.*remaining.*today/i)).toBeInTheDocument();
                expect(screen.getByText(/13.*remaining.*month/i)).toBeInTheDocument();
            });
        });

        it('should disable random button while loading', async () => {
            // Initial load
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // Mock slow API response
            mockFetch.mockImplementationOnce(() =>
                new Promise(resolve =>
                    setTimeout(() => resolve({
                        ok: true,
                        status: 200,
                        json: async () => mockSuccessResponse
                    }), 100)
                )
            );

            fireEvent.click(randomButton);

            // Button should be disabled during loading
            expect(randomButton).toBeDisabled();

            await waitFor(() => {
                expect(randomButton).not.toBeDisabled();
            });
        });

        it('should show loading state during API calls', async () => {
            // Initial load
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // Mock slow API response
            mockFetch.mockImplementationOnce(() =>
                new Promise(resolve =>
                    setTimeout(() => resolve({
                        ok: true,
                        status: 200,
                        json: async () => mockSuccessResponse
                    }), 100)
                )
            );

            fireEvent.click(randomButton);

            // Should show loading indicator
            expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('Rate limit handling', () => {
        it('should handle daily rate limit exceeded', async () => {
            // Initial successful load
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // Mock rate limit exceeded response
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: async () => mockRateLimitResponse,
                headers: new Headers({
                    'Retry-After': '3600'
                })
            });

            fireEvent.click(randomButton);

            await waitFor(() => {
                expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
            });

            // Should show retry information
            await waitFor(() => {
                expect(screen.getByText(/12:00 AM UTC/i)).toBeInTheDocument();
            });

            // Button should be disabled
            expect(randomButton).toBeDisabled();
        });

        it('should handle monthly rate limit exceeded', async () => {
            const monthlyLimitResponse = {
                ...mockRateLimitResponse,
                message: 'Monthly rate limit exceeded. You have made 15 requests this month. Limit resets on the 1st day of next month at 12:00 AM UTC.',
                rateLimit: {
                    ...mockRateLimitResponse.rateLimit,
                    dailyRemaining: 2,
                    monthlyRemaining: 0
                },
                retryAfter: 86400
            };

            // Initial successful load
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // Mock monthly rate limit exceeded response
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: async () => monthlyLimitResponse
            });

            fireEvent.click(randomButton);

            await waitFor(() => {
                expect(screen.getByText(/monthly rate limit exceeded/i)).toBeInTheDocument();
            });

            // Should show monthly reset information
            await waitFor(() => {
                expect(screen.getByText(/1st day of next month/i)).toBeInTheDocument();
            });
        });

        it('should show warning when approaching rate limits', async () => {
            const warningResponse = {
                ...mockSuccessResponse,
                rateLimit: {
                    ...mockSuccessResponse.rateLimit,
                    dailyRemaining: 1, // Only 1 remaining
                    monthlyRemaining: 3 // Only 3 remaining
                }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => warningResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(screen.getByText(/1.*remaining.*today/i)).toBeInTheDocument();
                expect(screen.getByText(/3.*remaining.*month/i)).toBeInTheDocument();
            });

            // Should show warning styling or message
            await waitFor(() => {
                expect(screen.getByText(/warning/i) || screen.getByText(/careful/i)).toBeInTheDocument();
            });
        });

        it('should implement retry logic with exponential backoff', async () => {
            // Initial successful load
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // Mock network error followed by success
            mockFetch
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: async () => mockSuccessResponse
                });

            fireEvent.click(randomButton);

            // Should retry automatically
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + failed + retry
            });

            // Should eventually show success
            await waitFor(() => {
                expect(screen.getByText('192.168.1.100:8080')).toBeInTheDocument();
            });
        });
    });

    describe('Error handling and user experience', () => {
        it('should handle network errors gracefully', async () => {
            // Initial successful load
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // Mock network error
            mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

            fireEvent.click(randomButton);

            await waitFor(() => {
                expect(screen.getByText(/network error/i) || screen.getByText(/connection failed/i)).toBeInTheDocument();
            });

            // Button should be re-enabled for retry
            expect(randomButton).not.toBeDisabled();
        });

        it('should handle server errors (500) gracefully', async () => {
            // Initial successful load
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // Mock server error
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({
                    success: false,
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Server data is temporarily unavailable'
                })
            });

            fireEvent.click(randomButton);

            await waitFor(() => {
                expect(screen.getByText(/server error/i) || screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
            });
        });

        it('should handle malformed API responses', async () => {
            // Initial successful load
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // Mock malformed response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ invalid: 'response' })
            });

            fireEvent.click(randomButton);

            await waitFor(() => {
                expect(screen.getByText(/invalid response/i) || screen.getByText(/unexpected error/i)).toBeInTheDocument();
            });
        });

        it('should provide clear user feedback for all states', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            // Should show loading state initially
            expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();

            // Should show success state after load
            await waitFor(() => {
                expect(screen.getByText('192.168.1.100:8080')).toBeInTheDocument();
            });

            // Should show rate limit information
            await waitFor(() => {
                expect(screen.getByText(/remaining/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels and roles', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                const randomButton = screen.getByRole('button', { name: /random/i });
                expect(randomButton).toHaveAttribute('aria-label');
            });

            // Rate limit information should be accessible
            await waitFor(() => {
                expect(screen.getByRole('status') || screen.getByLabelText(/rate limit/i)).toBeInTheDocument();
            });
        });

        it('should announce rate limit changes to screen readers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // Mock rate limit exceeded response
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: async () => mockRateLimitResponse
            });

            fireEvent.click(randomButton);

            await waitFor(() => {
                expect(screen.getByRole('alert') || screen.getByLabelText(/rate limit exceeded/i)).toBeInTheDocument();
            });
        });

        it('should support keyboard navigation', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                const randomButton = screen.getByRole('button', { name: /random/i });
                expect(randomButton).toBeVisible();
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // Should be focusable
            randomButton.focus();
            expect(randomButton).toHaveFocus();

            // Should respond to Enter key
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            fireEvent.keyDown(randomButton, { key: 'Enter', code: 'Enter' });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('Performance', () => {
        it('should debounce rapid button clicks', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // Rapid clicks
            fireEvent.click(randomButton);
            fireEvent.click(randomButton);
            fireEvent.click(randomButton);

            // Should only make one additional API call
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });
        });

        it('should cancel previous requests when new ones are made', async () => {
            const abortSpy = vi.fn();
            const mockAbortController = {
                abort: abortSpy,
                signal: { aborted: false }
            };

            // Mock AbortController
            global.AbortController = vi.fn(() => mockAbortController) as any;

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockSuccessResponse
            });

            render(
                <TestWrapper>
                    <Hero />
                </TestWrapper>
            );

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const randomButton = screen.getByRole('button', { name: /random/i });

            // First click
            fireEvent.click(randomButton);

            // Second click before first completes
            fireEvent.click(randomButton);

            // Should abort the first request
            expect(abortSpy).toHaveBeenCalled();
        });
    });
});