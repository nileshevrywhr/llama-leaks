import React, { useState, useEffect } from "react";
import { MapPin, Clock } from "lucide-react";
import Map from "./Map";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRandomServer = async () => {
      try {
        setLoading(true);
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
      }
    };

    fetchRandomServer();
  }, []);

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
              <MapPin className="h-12 w-12 mb-4 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">Unable to load map</p>
            </div>
          </div>
          <div className="bg-background/80 dark:bg-slate-900/80 backdrop-blur-sm border border-destructive/20 text-foreground p-6 rounded-lg">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Server Data</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Retry
              </button>
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

  return (
    <section className="container py-24">
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
          {/* Timestamp moved to top with age in parentheses */}
          <div className="mb-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Clock className="w-3 h-3" />
              <span>AS OF</span>
              <span className="text-foreground font-medium">{timestamp.formatted}</span>
              <span className="text-muted-foreground">({serverData.age})</span>
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
    </section>
  );
};

export default LocationInfo;