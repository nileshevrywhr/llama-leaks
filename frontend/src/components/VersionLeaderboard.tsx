import React, { useState, useEffect } from 'react';
import * as Sentry from "@sentry/react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Award, Server, HardDrive, Shield } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';
import { Button } from "@/components/ui/button";

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

interface VersionGroup {
  version: string;
  serverCount: number;
  totalModels: number;
  totalModelSize: number;
  liveServers: number;
}

const VersionLeaderboard = () => {

  const parseVersion = (versionString: string): string => {
    // Extract major.minor from version strings like "0.5.10", "0.3.11", "0.5.7-0-ga420a45-dirty"
    const match = versionString.match(/^(\d+\.\d+)/);
    return match ? match[1] : versionString;
  };

  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) {
      return `${gb.toFixed(1)}GB`;
    }
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)}MB`;
  };

  // Use React Query for version leaderboard data
  const { data: versionGroups, isLoading, error } = useQuery({
    queryKey: ['version-leaderboard'],
    queryFn: async () => {
      const response = await fetch('/data/live_servers.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch server data: ${response.status}`);
      }
      return response.json();
    },
    select: (serversObject): VersionGroup[] => {
      const serverEntries = Object.values(serversObject) as ServerData[];
      
      // Group servers by major.minor version
      const versionMap = new Map<string, {
        servers: ServerData[];
        totalModels: number;
        totalSize: number;
        liveCount: number;
      }>();
      
      serverEntries.forEach(server => {
        const majorMinor = parseVersion(server.version);
        
        if (!versionMap.has(majorMinor)) {
          versionMap.set(majorMinor, {
            servers: [],
            totalModels: 0,
            totalSize: 0,
            liveCount: 0
          });
        }
        
        const group = versionMap.get(majorMinor)!;
        group.servers.push(server);
        group.totalModels += server.local.length;
        group.totalSize += server.local.reduce((sum, model) => sum + model.size, 0);
        
        if (server.status === 'live') {
          group.liveCount++;
        }
      });
      
      // Convert to array and sort by version (older versions first)
      const groups: VersionGroup[] = Array.from(versionMap.entries()).map(([version, data]) => ({
        version,
        serverCount: data.servers.length,
        totalModels: data.totalModels,
        totalModelSize: data.totalSize,
        liveServers: data.liveCount
      }));
      
      // Sort by version number (older first)
      groups.sort((a, b) => {
        const aVersion = a.version.split('.').map(Number);
        const bVersion = b.version.split('.').map(Number);
        
        for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
          const aPart = aVersion[i] || 0;
          const bPart = bVersion[i] || 0;
          if (aPart !== bPart) {
            return aPart - bPart; // Ascending order (older first)
          }
        }
        return 0;
      });
      
      return groups;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });

  /* Old fetch function - keeping for reference but now using React Query
  useEffect(() => {
    const fetchAndGroupData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/data/live_servers.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch server data: ${response.status}`);
        }
        
        const serversObject = await response.json();
        const serverEntries = Object.values(serversObject) as ServerData[];
        
        // Group servers by major.minor version
        const versionMap = new Map<string, {
          servers: ServerData[];
          totalModels: number;
          totalSize: number;
          liveCount: number;
        }>();
        
        serverEntries.forEach(server => {
          const majorMinor = parseVersion(server.version);
          
          if (!versionMap.has(majorMinor)) {
            versionMap.set(majorMinor, {
              servers: [],
              totalModels: 0,
              totalSize: 0,
              liveCount: 0
            });
          }
          
          const group = versionMap.get(majorMinor)!;
          group.servers.push(server);
          group.totalModels += server.local.length;
          group.totalSize += server.local.reduce((sum, model) => sum + model.size, 0);
          
          if (server.status === 'live') {
            group.liveCount++;
          }
        });
        
        // Convert to array and sort by version (older versions first)
        const groups: VersionGroup[] = Array.from(versionMap.entries()).map(([version, data]) => ({
          version,
          serverCount: data.servers.length,
          totalModels: data.totalModels,
          totalModelSize: data.totalSize,
          liveServers: data.liveCount
        }));
        
        // Sort by version number (older first)
        groups.sort((a, b) => {
          const aVersion = a.version.split('.').map(Number);
          const bVersion = b.version.split('.').map(Number);
          
          for (let i = 0; i < Math.max(aVersion.length, bVersion.length); i++) {
            const aPart = aVersion[i] || 0;
            const bPart = bVersion[i] || 0;
            if (aPart !== bPart) {
              return aPart - bPart; // Ascending order (older first)
            }
          }
          return 0;
        });
        
        setVersionGroups(groups);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard data');
        console.error('Error fetching leaderboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndGroupData();
  }, []); */

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 1:
        return <Medal className="h-8 w-8 text-gray-400" />;
      case 2:
        return <Award className="h-8 w-8 text-amber-600" />;
      default:
        return <div className="h-8 w-8 flex items-center justify-center text-lg font-bold text-muted-foreground">#{index + 1}</div>;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return "from-yellow-500/10 to-yellow-600/10 border-yellow-500/20";
      case 1:
        return "from-gray-400/10 to-gray-500/10 border-gray-400/20";
      case 2:
        return "from-amber-600/10 to-amber-700/10 border-amber-600/20";
      default:
        return "from-muted/10 to-muted/20 border-muted/20";
    }
  };

  const getRankTitle = (index: number) => {
    switch (index) {
      case 0:
        return "🥇 Gold - Legacy Champion";
      case 1:
        return "🥈 Silver - Vintage Runner-up";
      case 2:
        return "🥉 Bronze - Classic Third";
      default:
        return `#${index + 1} Version`;
    }
  };

  if (isLoading) {
    return (
      <section className="container py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Version Leaderboard 🏆
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hall of Fame for Ollama versions by exposure count
          </p>
        </div>
        
        <div className="space-y-4 max-w-4xl mx-auto">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="relative p-6 rounded-lg border backdrop-blur-sm bg-muted/20 border-muted animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 bg-muted rounded"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
                <div className="text-right space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="container py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl mb-4">
            Version Leaderboard 🏆
          </h2>
          <p className="text-destructive mb-2">Failed to load leaderboard data</p>
          <p className="text-xs text-muted-foreground">{error?.message}</p>
        </div>
      </section>
    );
  }

  if (!versionGroups || versionGroups.length === 0) {
    return (
      <section className="container py-16">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl mb-4">
            Version Leaderboard 🏆
          </h2>
          <p className="text-muted-foreground">No version data available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-16">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Version Leaderboard 🏆
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          <span className="block">Hall of Fame for Ollama versions by exposure count</span>
          <span className="block text-sm">Because sometimes being outdated makes you famous</span>
        </p>
      </div>
      
      <div className="space-y-4 max-w-4xl mx-auto">
        {versionGroups.slice(0, 10).map((group, index) => (
          <div
            key={group.version}
            className={`relative group overflow-hidden rounded-lg border backdrop-blur-sm 
              bg-gradient-to-r ${getRankColor(index)} 
              transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                {/* Left side - Rank and Version */}
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <div className="font-semibold text-lg mb-1">
                      {getRankTitle(index)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Version {group.version}
                    </div>
                  </div>
                </div>

                {/* Right side - Statistics */}
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        <AnimatedCounter 
                          target={group.serverCount} 
                          duration={1500 + (index * 200)}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">Servers</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">
                        <AnimatedCounter 
                          target={group.liveServers} 
                          duration={1500 + (index * 200)}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">Live</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">
                        <AnimatedCounter 
                          target={group.totalModels} 
                          duration={1500 + (index * 200)}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">Models</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Total Size: {formatSize(group.totalModelSize)}
                  </div>
                </div>
              </div>
              
              {/* Progress bar for visual representation */}
              <div className="mt-4 h-2 bg-muted/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary/60 to-primary/80 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${Math.min(100, (group.serverCount / Math.max(...versionGroups.map(g => g.serverCount))) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Real-time data from live server monitoring. Rankings update automatically.
        </p>
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-16 space-y-4">
        <h3 className="text-xl font-semibold">
          Don't see your version here? That's either very good or very bad.
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Either you're running the latest secure version, or you're so outdated that even 
          our scanners gave up. Check if your server made it to the wall of shame.
        </p>
        <div className="pt-4">
          <Button size="lg" className="gap-2" asChild>
            <a href="/">
              <Shield className="h-5 w-5" />
              Check If You're Famous
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default VersionLeaderboard;