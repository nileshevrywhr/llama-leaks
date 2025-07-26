/**
 * Shared server data caching layer for API endpoints
 * Provides in-memory caching with TTL to optimize performance
 */

interface ServerModel {
    name: string;
    model: string;
    size: number;
}

interface ServerData {
    ip: string;
    port: number;
    version: string;
    city: string;
    country: string;
    country_name: string;
    region: string;
    latitude: string;
    longitude: string;
    local: ServerModel[];
    running: ServerModel[];
    first_seen_online: string;
    last_observed: string;
    age: string;
    status: string;
}

interface RawServerData {
    port: number;
    version: string;
    city: string;
    country: string;
    country_name: string;
    region: string;
    latitude: string;
    longitude: string;
    local: ServerModel[];
    running: ServerModel[];
    first_seen_online: string;
    last_observed: string;
    age: string;
    status: string;
    ip: string;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// In-memory cache
let cachedServerData: ServerData[] | null = null;
let cacheTime = 0;

/**
 * Load and parse the live servers JSON file
 * @param baseUrl Optional base URL to help with data loading
 * @returns Promise resolving to parsed server data
 */
async function loadServerData(baseUrl?: string): Promise<Record<string, RawServerData>> {
    try {
        // Try multiple approaches to load the data
        const attempts = [
            // Attempt 1: Use baseUrl if provided (from request context)
            ...(baseUrl ? [`${baseUrl}/data/live_servers.json`] : []),
            // Attempt 2: Use relative path (works in many Vercel deployments)
            '/data/live_servers.json',
            // Attempt 3: Use VERCEL_URL if available
            ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}/data/live_servers.json`] : []),
            // Attempt 4: Use localhost for development
            ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173/data/live_servers.json'] : []),
            // Attempt 5: Try common production URLs
            'https://llama-leaks.vercel.app/data/live_servers.json',
            'https://llama-leaks.onrender.com/data/live_servers.json'
        ];

        let lastError: Error | null = null;

        for (const dataUrl of attempts) {
            try {
                console.log(`Attempting to load server data from: ${dataUrl}`);

                const response = await fetch(dataUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'Cache-Control': 'no-cache'
                    },
                    // Add timeout to prevent hanging
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });

                if (!response.ok) {
                    console.warn(`Failed to fetch from ${dataUrl}: ${response.status} ${response.statusText}`);
                    lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
                    continue;
                }

                const data = await response.json();

                if (!data || typeof data !== 'object') {
                    console.warn(`Invalid data format from ${dataUrl}`);
                    lastError = new Error('Invalid server data format');
                    continue;
                }

                const serverCount = Object.keys(data).length;
                if (serverCount === 0) {
                    console.warn(`No servers found in data from ${dataUrl}`);
                    lastError = new Error('No servers available in data file');
                    continue;
                }

                console.log(`Successfully loaded ${serverCount} servers from: ${dataUrl}`);
                return data;

            } catch (fetchError) {
                console.warn(`Error fetching from ${dataUrl}:`, fetchError.message);
                lastError = fetchError;
                continue;
            }
        }

        // If all attempts failed, throw the last error
        throw lastError || new Error('All data loading attempts failed');

    } catch (error) {
        console.error('Critical error loading server data:', error);
        throw new Error(`Failed to load server data: ${error.message}`);
    }
}

/**
 * Convert raw server data to the expected ServerData format
 * @param hash Server hash key
 * @param rawData Raw server data from JSON
 * @returns Formatted ServerData object
 */
function formatServerData(hash: string, rawData: RawServerData): ServerData {
    return {
        ip: rawData.ip,
        port: rawData.port,
        version: rawData.version,
        city: rawData.city,
        country: rawData.country,
        country_name: rawData.country_name,
        region: rawData.region,
        latitude: rawData.latitude,
        longitude: rawData.longitude,
        local: rawData.local || [],
        running: rawData.running || [],
        first_seen_online: rawData.first_seen_online,
        last_observed: rawData.last_observed,
        age: rawData.age,
        status: rawData.status
    };
}

/**
 * Get cached server data with automatic cache refresh
 * @param baseUrl Optional base URL to help with data loading
 * @returns Promise resolving to array of ServerData objects
 */
export async function getCachedServerData(baseUrl?: string): Promise<ServerData[]> {
    const now = Date.now();

    // Check if cache is valid
    if (cachedServerData && (now - cacheTime) < CACHE_DURATION) {
        console.log('Returning cached server data');
        return cachedServerData;
    }

    try {
        console.log('Cache expired or empty, loading fresh data');

        // Load fresh data
        const rawServersData = await loadServerData(baseUrl);
        const serverHashes = Object.keys(rawServersData);

        if (serverHashes.length === 0) {
            throw new Error('No servers available in data file');
        }

        // Convert raw data to formatted ServerData array
        const formattedServers: ServerData[] = serverHashes.map(hash =>
            formatServerData(hash, rawServersData[hash])
        );

        // Update cache
        cachedServerData = formattedServers;
        cacheTime = now;

        console.log(`Cached ${formattedServers.length} servers`);

        return formattedServers;

    } catch (error) {
        console.error('Failed to load server data:', error);

        // If we have stale cached data, return it as fallback
        if (cachedServerData) {
            console.log('Returning stale cached data as fallback');
            return cachedServerData;
        }

        // No cached data available, re-throw error
        throw error;
    }
}

/**
 * Get a random server from cached data
 * @param baseUrl Optional base URL to help with data loading
 * @returns Promise resolving to a random ServerData object
 */
export async function getRandomServerData(baseUrl?: string): Promise<ServerData> {
    const servers = await getCachedServerData(baseUrl);

    if (servers.length === 0) {
        throw new Error('No servers available');
    }

    const randomIndex = Math.floor(Math.random() * servers.length);
    return servers[randomIndex];
}

/**
 * Calculate aggregate statistics from cached server data
 * @param baseUrl Optional base URL to help with data loading
 * @returns Promise resolving to statistics object
 */
export async function getServerStatistics(baseUrl?: string): Promise<{
    totalServers: number;
    liveServers: number;
    newToday: number;
    latestFindMinutes: number;
}> {
    const servers = await getCachedServerData(baseUrl);
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Calculate total servers
    const totalServers = servers.length;

    // Calculate live servers (status === "live")
    const liveServers = servers.filter(server => server.status === 'live').length;

    // Calculate new servers today (first_seen_online within last 24 hours)
    const newToday = servers.filter(server => {
        if (!server.first_seen_online) return false;
        try {
            const firstSeenDate = new Date(server.first_seen_online);
            return firstSeenDate >= oneDayAgo;
        } catch {
            return false;
        }
    }).length;

    // Calculate latest find (most recent first_seen_online)
    let latestFindMinutes = 0;
    const validFirstSeenDates = servers
        .filter(server => server.first_seen_online)
        .map(server => {
            try {
                return new Date(server.first_seen_online);
            } catch {
                return null;
            }
        })
        .filter(date => date !== null) as Date[];

    if (validFirstSeenDates.length > 0) {
        const latestDate = new Date(Math.max(...validFirstSeenDates.map(date => date.getTime())));
        const diffMs = now.getTime() - latestDate.getTime();
        latestFindMinutes = Math.floor(diffMs / (1000 * 60));
    }

    return {
        totalServers,
        liveServers,
        newToday,
        latestFindMinutes
    };
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
    cachedServerData = null;
    cacheTime = 0;
    console.log('Server data cache cleared');
}

/**
 * Get cache status information
 */
export function getCacheStatus(): {
    isCached: boolean;
    cacheAge: number;
    cacheSize: number;
} {
    const now = Date.now();
    return {
        isCached: cachedServerData !== null,
        cacheAge: cachedServerData ? now - cacheTime : 0,
        cacheSize: cachedServerData ? cachedServerData.length : 0
    };
}