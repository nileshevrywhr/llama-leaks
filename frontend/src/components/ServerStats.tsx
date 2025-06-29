import React, { useState, useEffect } from 'react';
import AnimatedCounter from './AnimatedCounter';

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
  last_observed: string;
  last_updated: string;
}

interface ServerStats {
  totalServers: number;
  liveServers: number;
  newToday: number;
  latestFindMinutes: number;
}

const ServerStats = () => {
  const [stats, setStats] = useState<ServerStats>({
    totalServers: 0,
    liveServers: 0,
    newToday: 0,
    latestFindMinutes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatTimeDuration = (minutes: number): string => {
    if (minutes < 1) {
      const seconds = Math.floor(minutes * 60);
      return seconds === 1 ? "1 second ago" : `${seconds} seconds ago`;
    } else if (minutes < 60) {
      const mins = Math.floor(minutes);
      return mins === 1 ? "1 minute ago" : `${mins} minutes ago`;
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    } else if (minutes < 10080) { // Less than 7 days
      const days = Math.floor(minutes / 1440);
      return days === 1 ? "1 day ago" : `${days} days ago`;
    } else if (minutes < 43200) { // Less than 30 days
      const weeks = Math.floor(minutes / 10080);
      return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
    } else {
      const months = Math.floor(minutes / 43200);
      return months === 1 ? "1 month ago" : `${months} months ago`;
    }
  };

  const formatTimeComponents = (minutes: number): { value: number; unit: string } => {
    if (minutes < 1) {
      const seconds = Math.floor(minutes * 60);
      return { value: seconds, unit: seconds === 1 ? "second ago" : "seconds ago" };
    } else if (minutes < 60) {
      const mins = Math.floor(minutes);
      return { value: mins, unit: mins === 1 ? "minute ago" : "minutes ago" };
    } else if (minutes < 1440) { // Less than 24 hours
      const hours = Math.floor(minutes / 60);
      return { value: hours, unit: hours === 1 ? "hour ago" : "hours ago" };
    } else if (minutes < 10080) { // Less than 7 days
      const days = Math.floor(minutes / 1440);
      return { value: days, unit: days === 1 ? "day ago" : "days ago" };
    } else if (minutes < 43200) { // Less than 30 days
      const weeks = Math.floor(minutes / 10080);
      return { value: weeks, unit: weeks === 1 ? "week ago" : "weeks ago" };
    } else {
      const months = Math.floor(minutes / 43200);
      return { value: months, unit: months === 1 ? "month ago" : "months ago" };
    }
  };

  useEffect(() => {
    const fetchAndCalculateStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/data/live_servers.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch server data: ${response.status}`);
        }
        
        const serversObject = await response.json();
        const serverEntries = Object.values(serversObject) as ServerData[];
        
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Calculate total servers
        const totalServers = serverEntries.length;
        
        // Calculate live servers (status === "live")
        const liveServers = serverEntries.filter(server => server.status === 'live').length;
        
        // Calculate new servers today (first_seen_online within last 24 hours)
        const newToday = serverEntries.filter(server => {
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
        const validFirstSeenDates = serverEntries
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
        
        setStats({
          totalServers,
          liveServers,
          newToday,
          latestFindMinutes
        });
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load server statistics');
        console.error('Error fetching server stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateStats();
  }, []);

  const statsConfig = [
    {
      value: stats.totalServers,
      label: "Total Servers",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10 border-blue-500/20"
    },
    {
      value: stats.liveServers,
      label: "Live Servers",
      color: "text-green-400", 
      bgColor: "bg-green-500/10 border-green-500/20"
    },
    {
      value: stats.newToday,
      label: "New Today",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10 border-orange-500/20"
    },
    {
      value: stats.latestFindMinutes,
      label: "Latest Find",
      color: "text-pink-400",
      bgColor: "bg-pink-500/10 border-pink-500/20",
      formatAsTime: true
    }
  ];

  if (loading) {
    return (
      <section className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {statsConfig.map((_, index) => (
            <div
              key={index}
              className="relative p-6 rounded-lg border backdrop-blur-sm bg-muted/20 border-muted animate-pulse"
            >
              <div className="text-center">
                <div className="h-8 md:h-10 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-20 mx-auto"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Loading real-time server statistics...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container py-12">
        <div className="text-center">
          <p className="text-sm text-destructive mb-2">Failed to load statistics</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {statsConfig.map((stat, index) => (
          <div
            key={index}
            className={`relative p-6 rounded-lg border backdrop-blur-sm ${stat.bgColor} transition-all duration-300 hover:scale-105`}
          >
            <div className="text-center">
              <div className={`text-2xl md:text-3xl font-bold ${stat.color} mb-2`}>
                {stat.formatAsTime ? (
                  <>
                    <div className="flex flex-col items-center">
                      <AnimatedCounter 
                        target={formatTimeComponents(stat.value).value} 
                        duration={2000 + (index * 300)}
                        className="text-2xl md:text-3xl font-bold"
                      />
                      <div className="text-xs md:text-sm font-normal text-center mt-1 leading-tight">
                        {formatTimeComponents(stat.value).unit}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <AnimatedCounter 
                      target={stat.value} 
                      duration={2000 + (index * 300)}
                    />
                    {stat.suffix && (
                      <span className="text-sm font-normal">{stat.suffix}</span>
                    )}
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Real-time data from live server monitoring. Updated automatically.
        </p>
      </div>
    </section>
  );
};

export default ServerStats;