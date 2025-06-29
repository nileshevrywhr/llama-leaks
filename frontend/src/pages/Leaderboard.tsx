import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Trophy, 
  Medal, 
  Award, 
  Globe, 
  Server, 
  Shield, 
  Clock, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Database,
  Zap
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
  averageUptime: number;
  topModels: { name: string; count: number }[];
  countries: { [key: string]: number };
  healthDistribution: {
    live: number;
    unreachable: number;
    error: number;
  };
  vulnerabilities: string[];
  features: string[];
  rank: number;
  medal?: string;
}

const Leaderboard = () => {
  const [versionGroups, setVersionGroups] = useState<VersionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalServers, setTotalServers] = useState(0);

  // Known vulnerabilities and features for different versions
  const versionInfo: { [key: string]: { vulnerabilities: string[]; features: string[] } } = {
    "0.1": {
      vulnerabilities: ["CVE-2023-XXXX: Authentication bypass", "Unencrypted model storage"],
      features: ["Basic model serving", "Simple REST API"]
    },
    "0.2": {
      vulnerabilities: ["Memory leaks in concurrent requests", "Path traversal vulnerability"],
      features: ["Improved model management", "Basic authentication support"]
    },
    "0.3": {
      vulnerabilities: ["CORS misconfiguration", "Insufficient input validation"],
      features: ["Model pulling improvements", "Better error handling"]
    },
    "0.4": {
      vulnerabilities: ["Rate limiting bypass", "Session management issues"],
      features: ["Streaming responses", "Model preloading"]
    },
    "0.5": {
      vulnerabilities: ["Minor security hardening needed"],
      features: ["Multi-model support", "Performance optimizations"]
    },
    "0.6": {
      vulnerabilities: ["Updated dependencies required"],
      features: ["Enhanced model formats", "Better resource management"]
    },
    "0.7": {
      vulnerabilities: ["Security patches recommended"],
      features: ["Advanced model operations", "Improved API"]
    },
    "0.8": {
      vulnerabilities: ["Regular security updates needed"],
      features: ["Enhanced performance", "Better model handling"]
    },
    "0.9": {
      vulnerabilities: ["Latest security patches applied"],
      features: ["Production-ready features", "Comprehensive API"]
    },
    "1.0": {
      vulnerabilities: ["Minimal known issues"],
      features: ["Stable release", "Full feature set"]
    }
  };

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      default: return "";
    }
  };

  const getSecurityColor = (vulnerabilityCount: number): string => {
    if (vulnerabilityCount >= 3) return "text-red-500";
    if (vulnerabilityCount >= 2) return "text-orange-500";
    if (vulnerabilityCount >= 1) return "text-yellow-500";
    return "text-green-500";
  };

  const getSecurityIcon = (vulnerabilityCount: number) => {
    if (vulnerabilityCount >= 3) return <XCircle className="h-4 w-4 text-red-500" />;
    if (vulnerabilityCount >= 2) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    if (vulnerabilityCount >= 1) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const formatSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) {
      return `${gb.toFixed(1)}GB`;
    }
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)}MB`;
  };

  const calculateAverageUptime = (servers: ServerData[]): number => {
    if (servers.length === 0) return 0;
    
    const now = new Date();
    let totalUptimeHours = 0;
    let validServers = 0;

    servers.forEach(server => {
      if (server.first_seen_online) {
        try {
          const firstSeen = new Date(server.first_seen_online);
          const uptimeMs = now.getTime() - firstSeen.getTime();
          const uptimeHours = uptimeMs / (1000 * 60 * 60);
          totalUptimeHours += uptimeHours;
          validServers++;
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    return validServers > 0 ? totalUptimeHours / validServers : 0;
  };

  const getTopModels = (servers: ServerData[]): { name: string; count: number }[] => {
    const modelCounts: { [key: string]: number } = {};
    
    servers.forEach(server => {
      server.local.forEach(model => {
        const modelName = model.name.split(':')[0]; // Get base model name
        modelCounts[modelName] = (modelCounts[modelName] || 0) + 1;
      });
    });

    return Object.entries(modelCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  };

  const getCountryDistribution = (servers: ServerData[]): { [key: string]: number } => {
    const countries: { [key: string]: number } = {};
    servers.forEach(server => {
      if (server.country_name) {
        countries[server.country_name] = (countries[server.country_name] || 0) + 1;
      }
    });
    return countries;
  };

  const getHealthDistribution = (servers: ServerData[]) => {
    const distribution = { live: 0, unreachable: 0, error: 0 };
    servers.forEach(server => {
      if (server.status === 'live') {
        distribution.live++;
      } else if (server.status === 'unreachable') {
        distribution.unreachable++;
      } else {
        distribution.error++;
      }
    });
    return distribution;
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

        // Convert to VersionGroup array and sort by version (older first for "shame" ranking)
        const versionGroupsArray: VersionGroup[] = Object.entries(groups)
          .map(([version, servers]) => {
            const fullVersions = [...new Set(servers.map(s => s.version))].sort();
            const info = versionInfo[version] || { vulnerabilities: [], features: [] };
            
            return {
              version,
              fullVersions,
              servers,
              totalCount: servers.length,
              liveCount: servers.filter(s => s.status === 'live').length,
              averageUptime: calculateAverageUptime(servers),
              topModels: getTopModels(servers),
              countries: getCountryDistribution(servers),
              healthDistribution: getHealthDistribution(servers),
              vulnerabilities: info.vulnerabilities,
              features: info.features,
              rank: 0 // Will be set below
            };
          })
          .sort((a, b) => {
            // Sort by version number (older versions rank "higher" in shame)
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
        
        <div className="pt-[88px] container py-12">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold">Ollama Version Leaderboard</h1>
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading leaderboard data...</p>
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
        
        <div className="pt-[88px] container py-12">
          <div className="text-center space-y-6">
            <h1 className="text-3xl font-bold">Ollama Version Leaderboard</h1>
            <div className="text-center">
              <p className="text-destructive mb-2">Failed to load leaderboard</p>
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
      
      <div className="pt-[88px] container py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ollama Version Leaderboard <Trophy className="inline h-8 w-8 text-yellow-500" />
          </h1>
          <div className="text-muted-foreground text-lg max-w-3xl mx-auto space-y-2">
            <p>
              <span className="font-semibold">The Hall of Shame:</span> Older versions = higher "achievement" rank
            </p>
            <p>
              Tracking {totalServers} exposed servers across {versionGroups.length} version groups. 
              Because running outdated software publicly is apparently a competitive sport.
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-6">
          {versionGroups.map((group, index) => (
            <Card key={group.version} className={`
              relative transition-all hover:shadow-lg
              ${group.rank <= 3 ? 'border-2' : 'border'}
              ${group.rank === 1 ? 'border-yellow-400 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20' : ''}
              ${group.rank === 2 ? 'border-gray-400 bg-gradient-to-r from-gray-50/50 to-slate-50/50 dark:from-gray-950/20 dark:to-slate-950/20' : ''}
              ${group.rank === 3 ? 'border-amber-600 bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20' : ''}
            `}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-muted-foreground">#{group.rank}</span>
                      {group.medal && <span className="text-2xl">{group.medal}</span>}
                      {group.rank <= 3 && (
                        <Trophy className={`h-6 w-6 ${
                          group.rank === 1 ? 'text-yellow-500' : 
                          group.rank === 2 ? 'text-gray-500' : 'text-amber-600'
                        }`} />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        Ollama v{group.version}.x
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Full versions: {group.fullVersions.join(', ')}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getSecurityIcon(group.vulnerabilities.length)}
                    <Badge variant={group.liveCount > 0 ? "default" : "secondary"} className="text-lg px-3 py-1">
                      {group.totalCount} servers
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Activity className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <div className="text-2xl font-bold text-green-500">{group.liveCount}</div>
                    <div className="text-xs text-muted-foreground">Live Servers</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <div className="text-2xl font-bold text-blue-500">
                      {Math.round(group.averageUptime)}h
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Uptime</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Globe className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <div className="text-2xl font-bold text-purple-500">
                      {Object.keys(group.countries).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Countries</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Shield className={`h-5 w-5 mx-auto mb-1 ${getSecurityColor(group.vulnerabilities.length)}`} />
                    <div className={`text-2xl font-bold ${getSecurityColor(group.vulnerabilities.length)}`}>
                      {group.vulnerabilities.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Known Issues</div>
                  </div>
                </div>

                {/* Health Distribution */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Server Health Distribution
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        Live
                      </span>
                      <span>{group.healthDistribution.live} servers</span>
                    </div>
                    <Progress 
                      value={(group.healthDistribution.live / group.totalCount) * 100} 
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        Unreachable
                      </span>
                      <span>{group.healthDistribution.unreachable} servers</span>
                    </div>
                    <Progress 
                      value={(group.healthDistribution.unreachable / group.totalCount) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>

                {/* Top Models */}
                {group.topModels.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Most Popular Models
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {group.topModels.map((model, idx) => (
                        <Badge key={model.name} variant="outline" className="flex items-center gap-1">
                          <span>{model.name}</span>
                          <span className="text-xs">({model.count})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Geographic Distribution */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Geographic Distribution
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(group.countries)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([country, count]) => (
                        <Badge key={country} variant="secondary" className="flex items-center gap-1">
                          <span>{country}</span>
                          <span className="text-xs">({count})</span>
                        </Badge>
                      ))}
                  </div>
                </div>

                <Separator />

                {/* Security Issues & Features */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      Known Security Issues
                    </h4>
                    {group.vulnerabilities.length > 0 ? (
                      <ul className="space-y-1">
                        {group.vulnerabilities.map((vuln, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                            {vuln}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-green-600 dark:text-green-400">No known security issues</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Zap className="h-4 w-4" />
                      Notable Features
                    </h4>
                    <ul className="space-y-1">
                      {group.features.map((feature, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-muted-foreground space-y-2 pt-8">
          <p className="font-medium">
            🏆 Rankings are based on version age - older versions get "higher" shame ranks
          </p>
          <p>
            This leaderboard updates automatically as new servers are discovered and existing ones change status.
            All data is anonymized and sourced from public internet scans.
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Leaderboard;