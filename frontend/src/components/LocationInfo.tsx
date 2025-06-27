import { MapPin, Clock } from "lucide-react";
import Map from "./Map";

const LocationInfo = () => {
  const serverData = {
    ip: "116.130.XXX.XXX",
    port: 11434,
    version: "0.6.8",
    city: "Beijing",
    country: "CN",
    country_name: "China",
    region: "Beijing",
    latitude: "39.907501",
    longitude: "116.397102",
    protocol: "http",
    local: [
      {
        name: "deepseek-r1:32b",
        model: "deepseek-r1:32b",
        size: 19851337809
      },
      {
        name: "bge-m3:latest",
        model: "bge-m3:latest",
        size: 1157672605
      },
      {
        name: "qwen3:32b",
        model: "qwen3:32b",
        size: 20201253588
      }
    ],
    running: [
      {
        name: "deepseek-r1:32b",
        model: "deepseek-r1:32b",
        size: 23088674816
      },
      {
        name: "qwen3:32b",
        model: "qwen3:32b",
        size: 25596877482
      },
      {
        name: "bge-m3:latest",
        model: "bge-m3:latest",
        size: 1715003392
      }
    ],
    first_seen_online: "2025-06-23T20:57:34.827728",
    age: "22 hours"
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

  const timestamp = formatTimestamp(serverData.first_seen_online);

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
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-500 text-xs">ONLINE</span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400">🇨🇳</span>
              <span className="text-foreground">
                {serverData.country} / {serverData.country_name} / {serverData.region} / {serverData.city}
              </span>
            </div>
          </div>

          {/* Protocol and Version */}
          <div className="space-y-1 mb-4">
            <div>
              <span className="text-muted-foreground">Protocol: </span>
              <span className="text-primary">{serverData.protocol}</span>
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
              {serverData.local.map((model, index) => (
                <span key={index}>
                  {model.name} ({formatSize(model.size)})
                  {index < serverData.local.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>

          {/* Running Models */}
          <div>
            <div className="text-accent mb-2">Running ({serverData.running.length})</div>
            <div className="text-xs text-muted-foreground">
              {serverData.running.map((model, index) => (
                <span key={index}>
                  {model.name} ({formatSize(model.size)})
                  {index < serverData.running.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LocationInfo;
