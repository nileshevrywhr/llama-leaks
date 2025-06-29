import React, { useState, useEffect } from "react";
import { MapPin, Clock, Shuffle, AlertCircle, Zap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Map from "./Map";
import { calculateTimeSinceWithAgo } from "@/lib/timeUtils";

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
  age: string;
  status: string;
}

const LocationInfo = () => {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate dynamic age using the utility function
  const dynamicAge = serverData ? calculateTimeSinceWithAgo(serverData.first_seen_online) : null;

  const fetchRandomServer = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch('/data/live_servers.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch server data: ${response.status}`);
      }
      
      const serversObject = await response.json();
      
      // Convert object to array of server entries
      const serverEntries = Object.values(serversObject) as ServerData[];
      
      if (serverEntries.length === 0) {
        throw new Error('No servers found in the data');
      }
      
      // Select a random server
      const randomIndex = Math.floor(Math.random() * serverEntries.length);
      const randomServer = serverEntries[randomIndex];
      
      setServerData(randomServer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching server data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRandomServer();
  }, []);

  const handleRefresh = () => {
    fetchRandomServer(true);
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    const gb = bytes / (1024 * 1024 * 1024);
    
    if (gb >= 1) {
      return `${gb.toFixed(1)}GB`;
    } else {
      return `${mb.toFixed(0)}MB`;
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return {
      formatted: `${month} ${day}, ${year} | ${time} UTC`,
      hoursAgo: diffHours
    };
  };

  // Get country flag emoji (basic mapping for common countries)
  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      'CN': '🇨🇳',
      'JP': '🇯🇵',
      'GB': '🇬🇧',
      'RU': '🇷🇺',
      'US': '🇺🇸',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'BR': '🇧🇷',
      'IN': '🇮🇳',
      'KR': '🇰🇷'
    };
    return flags[countryCode] || '🌍';
  };

  // Loading state
  if (loading) {
    return (
      <section className="container py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading server data...</p>
            </div>
          </div>
          <div className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-sm border border-border text-foreground p-6 rounded-lg">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="container py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mb-4 text-destructive mx-auto" />
              <p className="text-muted-foreground">Unable to load map</p>
            </div>
          </div>
          <div className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-sm border border-destructive/20 text-foreground p-6 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Server Data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button 
                onClick={() => fetchRandomServer()} 
                className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Data loaded successfully
  if (!serverData) {
    return null;
  }

  const timestamp = formatTimestamp(serverData.first_seen_online);

  return (
    <section className="container py-16">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Live Evidence: Random Exposed Server
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Each refresh shows a different real server that's currently exposed to the internet. 
          No hacking required—just public endpoints serving AI models to anyone who asks.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Map with API Integration */}
        <Map 
          latitude={serverData.latitude}
          longitude={serverData.longitude}
          city={serverData.city}
          country={serverData.country_name}
        />

        {/* Server Information */}
        <div className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-sm border border-border text-foreground p-6 rounded-lg font-mono text-sm">
          {/* Header with Refresh Button */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock className="w-3 h-3" />
              <span>LIVE SERVER DATA</span>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
              variant="outline"
              className={`
                relative overflow-hidden transition-all duration-200 
                hover:bg-primary hover:text-primary-foreground hover:border-primary
                focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background
                ${refreshing ? 'bg-primary/10' : ''}
              `}
              aria-label={refreshing ? "Loading new server data" : "Load new random server"}
            >
              <Shuffle 
                className={`h-4 w-4 transition-transform duration-200 ${
                  refreshing ? 'animate-pulse' : 'group-hover:scale-110'
                }`} 
              />
              <span className="ml-2 hidden sm:inline">
                {refreshing ? 'Loading...' : 'Random Server'}
              </span>
              {refreshing && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                              transform -skew-x-12 -translate-x-full animate-pulse" 
                />
              )}
            </Button>
          </div>

          {/* Timestamp */}
          <div className="mb-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>AS OF</span>
              <span className="text-foreground font-medium">{timestamp.formatted}</span>
              <span className="text-muted-foreground">({dynamicAge})</span>
            </div>
          </div>

          {/* Header with IP:Port and status */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-primary text-lg font-medium">
                {serverData.ip}:{serverData.port}
              </span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  serverData.status === 'live' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-xs ${
                  serverData.status === 'live' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {serverData.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400">{getCountryFlag(serverData.country)}</span>
              <span className="text-foreground">
                {serverData.country} / {serverData.country_name} / {serverData.region} / {serverData.city}
              </span>
            </div>
          </div>

          {/* Protocol and Version */}
          <div className="space-y-1 mb-4">
            <div>
              <span className="text-muted-foreground">Protocol: </span>
              <span className="text-primary">http</span>
            </div>
            <div>
              <span className="text-muted-foreground">Version: </span>
              <span className="text-primary">{serverData.version}</span>
            </div>
          </div>

          {/* Models - all in one line */}
          <div className="mb-4">
            <div className="text-accent mb-2">Server Age</div>
            <div className="text-xs text-muted-foreground mb-4">
              First discovered {dynamicAge}
            </div>
            
            <div className="text-accent mb-2">Local Models ({serverData.local.length})</div>
            <div className="text-xs text-muted-foreground">
              {serverData.local.length > 0 ? (
                serverData.local.map((model, index) => (
                  <span key={index}>
                    {model.name} ({formatSize(model.size)})
                    {index < serverData.local.length - 1 && ", "}
                  </span>
                ))
              ) : (
                <span>No local models</span>
              )}
            </div>
          </div>

          {/* Running Models */}
          <div>
            <div className="text-accent mb-2">Running ({serverData.running.length})</div>
            <div className="text-xs text-muted-foreground">
              {serverData.running.length > 0 ? (
                serverData.running.map((model, index) => (
                  <span key={index}>
                    {model.name} ({formatSize(model.size)})
                    {index < serverData.running.length - 1 && ", "}
                  </span>
                ))
              ) : (
                <span>No running models</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons Section */}
      <div className="mt-12 p-8 bg-gradient-to-br from-destructive/5 to-orange-500/5 border border-destructive/20 rounded-xl">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-destructive">
              What Could Someone Do With This Access?
            </h3>
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              These servers are completely open. Here's what a malicious actor could potentially do:
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <Button 
              variant="destructive" 
              size="lg" 
              className="flex-1 gap-2 bg-destructive/90 hover:bg-destructive transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled
              title="Educational purposes only - not functional"
            >
              <Eye className="h-5 w-5" />
              Evil Action #1
            </Button>

            <Button 
              variant="destructive" 
              size="lg" 
              className="flex-1 gap-2 bg-gradient-to-r from-destructive to-orange-600 hover:from-destructive/90 hover:to-orange-600/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled
              title="Educational purposes only - not functional"
            >
              <Zap className="h-5 w-5" />
              Evil Action #2
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">🛡️ Don't worry - these buttons don't actually do anything harmful.</p>
            <p>This is purely educational to demonstrate the security implications of exposed AI servers.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationInfo;