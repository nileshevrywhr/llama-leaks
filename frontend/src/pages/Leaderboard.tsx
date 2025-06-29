import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database
} from "lucide-react";
import Header from "@/components/Header";
import WarningBanner from "@/components/WarningBanner";
import Footer from "@/components/Footer";

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
  fullVersions: string[];
  servers: ServerData[];
  totalCount: number;
  liveCount: number;
  topModels: { name: string; count: number }[];
  vulnerabilities: string[];
  rank: number;
  medal?: string;
}

const Leaderboard = () => {
  const [versionGroups, setVersionGroups] = useState<VersionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalServers, setTotalServers] = useState(0);

  // Known vulnerabilities for different versions (simplified)
  const versionInfo: { [key: string]: { vulnerabilities: string[] } } = {
    "0.1": { vulnerabilities: ["Authentication bypass", "Unencrypted storage", "Path traversal"] },
    "0.2": { vulnerabilities: ["Memory leaks", "CORS misconfiguration"] },
    "0.3": { vulnerabilities: ["CORS misconfiguration", "Input validation issues"] },
    "0.4": { vulnerabilities: ["Rate limiting bypass"] },
    "0.5": { vulnerabilities: ["Security hardening needed"] },
    "0.6": { vulnerabilities: ["Dependencies outdated"] },
    "0.7": { vulnerabilities: ["Security patches recommended"] },
    "0.8": { vulnerabilities: ["Regular updates needed"] },
    "0.9": { vulnerabilities: ["Latest patches applied"] },
    "1.0": { vulnerabilities: [] }
  };

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return "";
    }
  };

  const getSecurityIcon = (vulnerabilityCount: number) => {
    if (vulnerabilityCount >= 3) return <XCircle className="h-5 w-5 text-red-500" />;
    if (vulnerabilityCount >= 2) return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    if (vulnerabilityCount >= 1) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getTopModels = (servers: ServerData[]): { name: string; count: number }[] => {
    const modelCounts: { [key: string]: number } = {};
    
    servers.forEach(server => {
      server.local.forEach(model => {
        const modelName = model.name.split(':')[0];
        modelCounts[modelName] = (modelCounts[modelName] || 0) + 1;
      });
    });

    return Object.entries(modelCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/data/live_servers.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch server data: ${response.status}`);
        }
        
        const serversObject = await response.json();
        const serverEntries = Object.values(serversObject) as ServerData[];
        
        setTotalServers(serverEntries.length);

        // Group servers by major.minor version
        const groups: { [key: string]: ServerData[] } = {};
        
        serverEntries.forEach(server => {
          const versionParts = server.version.split('.');
          if (versionParts.length >= 2) {
            const majorMinor = `${versionParts[0]}.${versionParts[1]}`;
            if (!groups[majorMinor]) {
              groups[majorMinor] = [];
            }
            groups[majorMinor].push(server);
          }
        });

        // Convert to VersionGroup array and sort by version (older first)
        const versionGroupsArray: VersionGroup[] = Object.entries(groups)
          .map(([version, servers]) => {
            const fullVersions = [...new Set(servers.map(s => s.version))].sort();
            const info = versionInfo[version] || { vulnerabilities: [] };
            
            return {
              version,
              fullVersions,
              servers,
              totalCount: servers.length,
              liveCount: servers.filter(s => s.status === 'live').length,
              topModels: getTopModels(servers),
              vulnerabilities: info.vulnerabilities,
              rank: 0
            };
          })
          .sort((a, b) => {
            // Sort by version number (older versions rank "higher")
            const aVersion = parseFloat(a.version);
            const bVersion = parseFloat(b.version);
            return aVersion - bVersion;
          })
          .map((group, index) => ({
            ...group,
            rank: index + 1,
            medal: index < 3 ? getMedalEmoji(index + 1) : undefined
          }));

        setVersionGroups(versionGroupsArray);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard data');
        console.error('Error fetching leaderboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <WarningBanner />
        
        <div className="pt-[88px] container py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Version Champions
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Ranking the most vulnerable Ollama deployments by version age
              </p>
            </div>
            
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading champions...</p>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <WarningBanner />
        
        <div className="pt-[88px] container py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Version Champions
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Ranking the most vulnerable Ollama deployments by version age
              </p>
            </div>
            
            <div className="text-center">
              <p className="text-destructive mb-2">Failed to load champions</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <WarningBanner />
      
      <div className="pt-[88px] container py-24 space-y-16">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              Version Champions
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Celebrating the most vulnerable Ollama deployments. Older versions earn higher ranks.
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{totalServers}</span> exposed servers across <span className="font-medium">{versionGroups.length}</span> version groups
          </div>
        </div>

        {/* Leaderboard Grid */}
        <div className="grid gap-8 md:gap-12">
          {versionGroups.map((group, index) => (
            <Card 
              key={group.version} 
              className={`
                relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1
                ${group.rank <= 3 ? 'border-2' : 'border'}
                ${group.rank === 1 ? 'border-yellow-400 bg-gradient-to-br from-yellow-50/30 to-orange-50/30 dark:from-yellow-950/10 dark:to-orange-950/10' : ''}
                ${group.rank === 2 ? 'border-gray-400 bg-gradient-to-br from-gray-50/30 to-slate-50/30 dark:from-gray-950/10 dark:to-slate-950/10' : ''}
                ${group.rank === 3 ? 'border-amber-600 bg-gradient-to-br from-amber-50/30 to-yellow-50/30 dark:from-amber-950/10 dark:to-yellow-950/10' : ''}
                ${group.rank > 3 ? 'hover:border-primary/20' : ''}
              `}
            >
              <CardHeader className="pb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Rank & Medal */}
                    <div className="flex items-center gap-3">
                      <div className={`
                        text-4xl font-bold
                        ${group.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}
                      `}>
                        #{group.rank}
                      </div>
                      {group.medal && (
                        <div className="text-3xl">{group.medal}</div>
                      )}
                    </div>
                    
                    {/* Version Info */}
                    <div className="space-y-1">
                      <CardTitle className="text-3xl font-bold">
                        v{group.version}.x
                      </CardTitle>
                      <CardDescription className="text-base">
                        {group.fullVersions.join(', ')}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Server Count */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {group.totalCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      servers
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* Key Metrics Row */}
                <div className="grid grid-cols-3 gap-8">
                  {/* Security Status */}
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center">
                      {getSecurityIcon(group.vulnerabilities.length)}
                    </div>
                    <div>
                      <div className="text-xl font-semibold">
                        {group.vulnerabilities.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        vulnerabilities
                      </div>
                    </div>
                  </div>
                  
                  {/* Live Servers */}
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-green-500">
                        {group.liveCount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        live now
                      </div>
                    </div>
                  </div>
                  
                  {/* Top Models */}
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center">
                      <Database className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-blue-500">
                        {group.topModels.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        model types
                      </div>
                    </div>
                  </div>
                </div>

                {/* Popular Models */}
                {group.topModels.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Popular Models
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {group.topModels.map((model, idx) => (
                        <Badge 
                          key={model.name} 
                          variant="secondary" 
                          className="text-sm py-1 px-3 transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          {model.name} ({model.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Issues */}
                {group.vulnerabilities.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-destructive uppercase tracking-wide">
                      Known Issues
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {group.vulnerabilities.slice(0, 3).map((vuln, idx) => (
                        <Badge 
                          key={idx} 
                          variant="destructive" 
                          className="text-sm py-1 px-3"
                        >
                          {vuln}
                        </Badge>
                      ))}
                      {group.vulnerabilities.length > 3 && (
                        <Badge variant="outline" className="text-sm py-1 px-3">
                          +{group.vulnerabilities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center space-y-2 pt-8 border-t">
          <p className="text-sm font-medium text-muted-foreground">
            🏆 Higher ranks = older, more vulnerable versions
          </p>
          <p className="text-xs text-muted-foreground">
            All data is anonymized and sourced from public internet scans
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Leaderboard;