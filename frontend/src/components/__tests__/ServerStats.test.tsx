/**
 * Integration tests for ServerStats component with new API endpoint
 * Tests the updated component behavior with /api/stats endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ServerStats from '../ServerStats';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods to avoid noise in tests
const consoleSpy = {
    error: vi.spyOn(console, 'error').mockImplementation(() => { }),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => { })
};

// Mock statistics response
const mockStatsResponse = {
    success: true,
    statistics: {
        totalServers: 1250,
        liveServers: 1100,
        newToday: 45,
        latestFindMinutes: 12
    },
    lastUpdated: '2024-03-15T14:30:00.000Z'
};

const mockEmptyStatsResponse = {
    success: true,
    statistics: {
        totalServers: 0,
        liveServers: 0,
        newToday: 0,
        latestFindMinutes: 0
    },
    lastUpdated: '2024-03-15T14:30:00.000Z'
};

const mockErrorResponse = {
    success: false,
    error: 'DATA_UNAVAILABLE',
    message: 'Server data is temporarily unavailable'
};

describe('ServerStats Component Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.values(consoleSpy).forEach(spy => spy.mockClear());
        mockFetch.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Successful data loading', () => {
        it('should load statistics from /api/stats endpoint', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse,
                headers: new Headers({
                    'Cache-Control': 'public, max-age=300'
                })
            });

            render(<ServerStats />);

            // Wait for the API call to complete
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/stats', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            });

            // Check that statistics are displayed
            await waitFor(() => {
                expect(screen.getByText('1,250')).toBeInTheDocument(); // Total servers
                expect(screen.getByText('1,100')).toBeInTheDocument(); // Live servers
                expect(screen.getByText('45')).toBeInTheDocument(); // New today
                expect(screen.getByText('12')).toBeInTheDocument(); // Latest find minutes
            });
        });

        it('should display formatted numbers correctly', async () => {
            const largeStatsResponse = {
                ...mockStatsResponse,
                statistics: {
                    totalServers: 12500,
                    liveServers: 11000,
                    newToday: 450,
                    latestFindMinutes: 120
                }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => largeStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(screen.getByText('12,500')).toBeInTheDocument();
                expect(screen.getByText('11,000')).toBeInTheDocument();
                expect(screen.getByText('450')).toBeInTheDocument();
                expect(screen.getByText('120')).toBeInTheDocument();
            });
        });

        it('should show appropriate labels for each statistic', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(screen.getByText(/total.*servers/i)).toBeInTheDocument();
                expect(screen.getByText(/live.*servers/i)).toBeInTheDocument();
                expect(screen.getByText(/new.*today/i)).toBeInTheDocument();
                expect(screen.getByText(/latest.*find/i)).toBeInTheDocument();
            });
        });

        it('should handle zero values gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockEmptyStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(screen.getByText('0')).toBeInTheDocument();
            });

            // Should show appropriate messaging for empty state
            await waitFor(() => {
                expect(screen.getByText(/no.*servers/i) || screen.getByText(/empty/i)).toBeInTheDocument();
            });
        });

        it('should display last updated timestamp', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(screen.getByText(/last.*updated/i)).toBeInTheDocument();
                expect(screen.getByText(/2024-03-15/)).toBeInTheDocument();
            });
        });
    });

    describe('Loading states', () => {
        it('should show loading state while fetching data', async () => {
            // Mock slow response
            mockFetch.mockImplementationOnce(() =>
                new Promise(resolve =>
                    setTimeout(() => resolve({
                        ok: true,
                        status: 200,
                        json: async () => mockStatsResponse
                    }), 100)
                )
            );

            render(<ServerStats />);

            // Should show loading indicator
            expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
            });
        });

        it('should show skeleton loading for each statistic', async () => {
            mockFetch.mockImplementationOnce(() =>
                new Promise(resolve =>
                    setTimeout(() => resolve({
                        ok: true,
                        status: 200,
                        json: async () => mockStatsResponse
                    }), 100)
                )
            );

            render(<ServerStats />);

            // Should show skeleton placeholders
            const skeletons = screen.getAllByTestId('skeleton') || screen.getAllByRole('progressbar');
            expect(skeletons.length).toBeGreaterThan(0);

            await waitFor(() => {
                expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
            });
        });
    });

    describe('Error handling', () => {
        it('should handle API errors gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => mockErrorResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(screen.getByText(/error/i) || screen.getByText(/unavailable/i)).toBeInTheDocument();
            });

            // Should show retry option
            await waitFor(() => {
                expect(screen.getByRole('button', { name: /retry/i }) || screen.getByText(/try again/i)).toBeInTheDocument();
            });
        });

        it('should handle network errors gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            render(<ServerStats />);

            await waitFor(() => {
                expect(screen.getByText(/network.*error/i) || screen.getByText(/connection.*failed/i)).toBeInTheDocument();
            });
        });

        it('should handle malformed API responses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ invalid: 'response' })
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(screen.getByText(/invalid.*response/i) || screen.getByText(/unexpected.*error/i)).toBeInTheDocument();
            });
        });

        it('should provide fallback values when statistics are missing', async () => {
            const incompleteResponse = {
                success: true,
                statistics: {
                    totalServers: 100
                    // Missing other fields
                },
                lastUpdated: '2024-03-15T14:30:00.000Z'
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => incompleteResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(screen.getByText('100')).toBeInTheDocument(); // totalServers
                expect(screen.getByText('0')).toBeInTheDocument(); // fallback values
            });
        });
    });

    describe('Data refresh and caching', () => {
        it('should respect cache headers from API', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse,
                headers: new Headers({
                    'Cache-Control': 'public, max-age=300',
                    'ETag': '"abc123"'
                })
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            // Subsequent renders should use cached data
            render(<ServerStats />);

            // Should not make additional API calls immediately
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        it('should provide manual refresh functionality', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            // Find and click refresh button
            const refreshButton = screen.getByRole('button', { name: /refresh/i }) ||
                screen.getByLabelText(/refresh/i);

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    ...mockStatsResponse,
                    statistics: {
                        ...mockStatsResponse.statistics,
                        totalServers: 1300 // Updated value
                    }
                })
            });

            fireEvent.click(refreshButton);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });

            // Should show updated data
            await waitFor(() => {
                expect(screen.getByText('1,300')).toBeInTheDocument();
            });
        });

        it('should auto-refresh data periodically', async () => {
            vi.useFakeTimers();

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            // Advance time by refresh interval (e.g., 5 minutes)
            vi.advanceTimersByTime(5 * 60 * 1000);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });

            vi.useRealTimers();
        });
    });

    describe('Visual presentation', () => {
        it('should display statistics in a visually appealing layout', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                // Should have proper grid or card layout
                expect(screen.getByTestId('stats-grid') || screen.getByRole('grid')).toBeInTheDocument();
            });

            // Each statistic should be in its own card/section
            await waitFor(() => {
                const statCards = screen.getAllByTestId('stat-card') || screen.getAllByRole('gridcell');
                expect(statCards.length).toBe(4);
            });
        });

        it('should use appropriate icons for each statistic', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                // Should have icons for each statistic type
                expect(screen.getByLabelText(/server.*icon/i) || screen.getByTestId('server-icon')).toBeInTheDocument();
                expect(screen.getByLabelText(/live.*icon/i) || screen.getByTestId('live-icon')).toBeInTheDocument();
                expect(screen.getByLabelText(/new.*icon/i) || screen.getByTestId('new-icon')).toBeInTheDocument();
                expect(screen.getByLabelText(/time.*icon/i) || screen.getByTestId('time-icon')).toBeInTheDocument();
            });
        });

        it('should highlight important statistics', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                // Live servers should be highlighted (e.g., with green color)
                const liveServersElement = screen.getByText('1,100').closest('[data-testid="stat-card"]');
                expect(liveServersElement).toHaveClass(/live|success|green/);
            });
        });

        it('should show trends or changes when available', async () => {
            const trendingStatsResponse = {
                ...mockStatsResponse,
                statistics: {
                    ...mockStatsResponse.statistics,
                    trends: {
                        totalServers: '+50',
                        liveServers: '+25',
                        newToday: '+5'
                    }
                }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => trendingStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(screen.getByText('+50') || screen.getByText(/increase/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels and roles', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                // Main container should have appropriate role
                expect(screen.getByRole('region') || screen.getByLabelText(/statistics/i)).toBeInTheDocument();
            });

            // Each statistic should be properly labeled
            await waitFor(() => {
                expect(screen.getByLabelText(/total.*servers.*1250/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/live.*servers.*1100/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/new.*today.*45/i)).toBeInTheDocument();
                expect(screen.getByLabelText(/latest.*find.*12/i)).toBeInTheDocument();
            });
        });

        it('should announce updates to screen readers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                // Should have live region for updates
                expect(screen.getByRole('status') || screen.getByLabelText(/live.*region/i)).toBeInTheDocument();
            });
        });

        it('should support keyboard navigation', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                const refreshButton = screen.getByRole('button', { name: /refresh/i });
                expect(refreshButton).toBeVisible();
            });

            const refreshButton = screen.getByRole('button', { name: /refresh/i });

            // Should be focusable
            refreshButton.focus();
            expect(refreshButton).toHaveFocus();

            // Should respond to Enter key
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            fireEvent.keyDown(refreshButton, { key: 'Enter', code: 'Enter' });

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('Performance', () => {
        it('should handle large numbers efficiently', async () => {
            const largeStatsResponse = {
                ...mockStatsResponse,
                statistics: {
                    totalServers: 999999,
                    liveServers: 888888,
                    newToday: 77777,
                    latestFindMinutes: 66666
                }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => largeStatsResponse
            });

            const startTime = Date.now();
            render(<ServerStats />);

            await waitFor(() => {
                expect(screen.getByText('999,999')).toBeInTheDocument();
            });

            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(1000); // Should render quickly
        });

        it('should debounce rapid refresh requests', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            render(<ServerStats />);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            const refreshButton = screen.getByRole('button', { name: /refresh/i });

            // Rapid clicks
            fireEvent.click(refreshButton);
            fireEvent.click(refreshButton);
            fireEvent.click(refreshButton);

            // Should only make one additional API call
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(2);
            });
        });

        it('should cleanup resources on unmount', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockStatsResponse
            });

            const { unmount } = render(<ServerStats />);

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledTimes(1);
            });

            // Unmount component
            unmount();

            // Should not make additional API calls after unmount
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });
});