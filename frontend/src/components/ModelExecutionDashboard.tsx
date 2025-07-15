import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Square, 
  Server, 
  Clock, 
  Activity,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Database,
  MapPin,
  Zap,
  HardDrive
} from "lucide-react";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { formatDistanceToNowStrict } from "date-fns";
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
  last_observed: string;
  age: string;
  status: string;
}

interface ModelExecution {
  modelName: string;
  totalServers: number;
  runningServers: number;
  totalSize: number;
  averageSize: number;
  servers: {
    server: ServerData;
    isRunning: boolean;
    isLocal: boolean;
    modelSize: number;
    lastSeen: string;
  }[];
  lastActivity: string;
  executionFrequency: number;
}

type SortOption = 'name' | 'servers' | 'running' | 'frequency' | 'size';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'running' | 'stopped' | 'available';

const ModelExecutionDashboard = () => {
  const [serverData, setServerData] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverFilter, setServerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('servers');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const modelsPerPage = 10;

  const fetchServerData = async (isRefresh = false) => {
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
      const serverEntries = Object.values(serversObject) as ServerData[];
      
      setServerData(serverEntries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load model execution data');
      console.error('Error fetching server data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServerData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchServerData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const modelExecutions = useMemo(() => {
    const modelMap = new Map<string, ModelExecution>();
    
    serverData.forEach(server => {
      // Process local models
      server.local.forEach(model => {
        const key = model.name;
        if (!modelMap.has(key)) {
          modelMap.set(key, {
            modelName: model.name,
            totalServers: 0,
            runningServers: 0,
            totalSize: 0,
            averageSize: 0,
            servers: [],
            lastActivity: server.last_observed,
            executionFrequency: 0
          });
        }
        
        const execution = modelMap.get(key)!;
        const isRunning = server.running.some(runningModel => runningModel.name === model.name);
        
        execution.servers.push({
          server,
          isRunning,
          isLocal: true,
          modelSize: model.size,
          lastSeen: server.last_observed
        });
        
        execution.totalServers++;
        if (isRunning) execution.runningServers++;
        execution.totalSize += model.size;
        
        // Update last activity if this server was seen more recently
        if (new Date(server.last_observed) > new Date(execution.lastActivity)) {
          execution.lastActivity = server.last_observed;
        }
      });
      
      // Process running models that might not be in local
      server.running.forEach(model => {
        const key = model.name;
        if (!modelMap.has(key)) {
          modelMap.set(key, {
            modelName: model.name,
            totalServers: 0,
            runningServers: 0,
            totalSize: 0,
            averageSize: 0,
            servers: [],
            lastActivity: server.last_observed,
            executionFrequency: 0
          });
        }
        
        const execution = modelMap.get(key)!;
        const existingServer = execution.servers.find(s => s.server.ip === server.ip && s.server.port === server.port);
        
        if (!existingServer) {
          execution.servers.push({
            server,
            isRunning: true,
            isLocal: false,
            modelSize: model.size,
            lastSeen: server.last_observed
          });
          
          execution.totalServers++;
          execution.runningServers++;
          execution.totalSize += model.size;
        }
      });
    });
    
    // Calculate averages and execution frequency
    modelMap.forEach(execution => {
      execution.averageSize = execution.totalSize / execution.totalServers;
      execution.executionFrequency = execution.runningServers / execution.totalServers;
    });
    
    return Array.from(modelMap.values());
  }, [serverData]);

  // Reset current page when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, serverFilter, statusFilter, sortBy, sortDirection]);

  const filteredAndSortedModels = useMemo(() => {
    let filtered = modelExecutions.filter(model => {
      // Search filter
      if (searchTerm && !model.modelName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Server filter
      if (serverFilter !== 'all') {
        const hasServer = model.servers.some(s => 
          `${s.server.ip}:${s.server.port}` === serverFilter ||
          s.server.city.toLowerCase().includes(serverFilter.toLowerCase()) ||
          s.server.country_name.toLowerCase().includes(serverFilter.toLowerCase())
        );
        if (!hasServer) return false;
      }
      
      // Status filter
      switch (statusFilter) {
        case 'running':
          return model.runningServers > 0;
        case 'stopped':
          return model.runningServers === 0 && model.totalServers > 0;
        case 'available':
          return model.totalServers > 0;
        default:
          return true;
      }
    });
    
    // Sort
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortBy) {
        case 'name':
          aValue = a.modelName.toLowerCase();
          bValue = b.modelName.toLowerCase();
          break;
        case 'servers':
          aValue = a.totalServers;
          bValue = b.totalServers;
          break;
        case 'running':
          aValue = a.runningServers;
          bValue = b.runningServers;
          break;
        case 'frequency':
          aValue = a.executionFrequency;
          bValue = b.executionFrequency;
          break;
        case 'size':
          aValue = a.averageSize;
          bValue = b.averageSize;
          break;
        default:
          aValue = a.totalServers;
          bValue = b.totalServers;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });
    
    return filtered;
  }, [modelExecutions, searchTerm, serverFilter, statusFilter, sortBy, sortDirection]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedModels.length / modelsPerPage);
  const indexOfLastModel = currentPage * modelsPerPage;
  const indexOfFirstModel = indexOfLastModel - modelsPerPage;
  const currentModels = filteredAndSortedModels.slice(indexOfFirstModel, indexOfLastModel);

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) {
      return `${gb.toFixed(1)}GB`;
    }
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)}MB`;
  };

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNowStrict(date, { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: { [key: string]: string } = {
      'CN': '🇨🇳', 'JP': '🇯🇵', 'GB': '🇬🇧', 'RU': '🇷🇺', 'US': '🇺🇸',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'CA': '🇨🇦',
      'AU': '🇦🇺', 'BR': '🇧🇷', 'IN': '🇮🇳', 'KR': '🇰🇷'
    };
    return flags[countryCode] || '🌍';
  };

  const toggleModelExpansion = (modelName: string) => {
    const newExpanded = new Set(expandedModels);
    if (newExpanded.has(modelName)) {
      newExpanded.delete(modelName);
    } else {
      newExpanded.add(modelName);
    }
    setExpandedModels(newExpanded);
  };

  const handleRefresh = () => {
    fetchServerData(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the models section when page changes
    const modelsSection = document.getElementById('models-section');
    if (modelsSection) {
      modelsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const uniqueServers = useMemo(() => {
    const servers = new Set<string>();
    serverData.forEach(server => {
      servers.add(`${server.ip}:${server.port}`);
      servers.add(server.city);
      servers.add(server.country_name);
    });
    return Array.from(servers).sort();
  }, [serverData]);

  if (loading) {
    return (
      <section className="container py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Model Execution Dashboard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Loading model execution data across all servers...
          </p>
        </div>
        
        <div className="space-y-4 max-w-6xl mx-auto">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="relative p-6 rounded-lg border backdrop-blur-sm bg-muted/20 border-muted animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-6 bg-muted rounded w-32"></div>
                  <div className="h-4 bg-muted rounded w-20"></div>
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
            Model Execution Dashboard
          </h2>
          <p className="text-destructive mb-2">Failed to load model execution data</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button onClick={() => fetchServerData()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-16">
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Model Execution Dashboard 🚀
        </h2>
        
        {/* Haiku */}
        <div className="max-w-md mx-auto p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg">
          <div className="text-sm font-mono text-muted-foreground italic leading-relaxed">
            <div>No keys, no limits here</div>
            <div>AI models run wild and free—</div>
            <div>Internet's playground</div>
          </div>
        </div>
        
        {/* Body copy */}
        <div className="text-muted-foreground max-w-3xl mx-auto space-y-2">
          <p>
            Welcome to the wild west of AI, where LLM servers roam free without authentication, rate limits, or adult supervision. 
            These beautifully exposed endpoints are running everything from creative writing assistants to code generators—all waiting for your prompts.
          </p>
          <p className="text-sm">
            What makes them special? Zero barriers, infinite possibilities, and the kind of open access that would make security teams weep. 
            Perfect for experimentation, research, or just seeing what happens when AI meets the honor system.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">
              <AnimatedCounter target={modelExecutions.length} duration={1500} />
            </div>
            <div className="text-sm text-muted-foreground">Unique Models</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">
              <AnimatedCounter 
                target={modelExecutions.reduce((sum, model) => sum + model.runningServers, 0)} 
                duration={1500} 
              />
            </div>
            <div className="text-sm text-muted-foreground">Active Executions</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-500">
              <AnimatedCounter target={serverData.length} duration={1500} />
            </div>
            <div className="text-sm text-muted-foreground">Total Servers</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500">
              <AnimatedCounter 
                target={Math.round(modelExecutions.reduce((sum, model) => sum + model.totalSize, 0) / (1024 * 1024 * 1024))} 
                duration={1500} 
              />
              <span className="text-sm font-normal">GB</span>
            </div>
            <div className="text-sm text-muted-foreground">Total Model Size</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="max-w-6xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Controls
              </CardTitle>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Server Filter */}
              <Select value={serverFilter} onValueChange={setServerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by server" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Servers</SelectItem>
                  {uniqueServers.slice(0, 20).map(server => (
                    <SelectItem key={server} value={server}>{server}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="running">Currently Running</SelectItem>
                  <SelectItem value="stopped">Available but Stopped</SelectItem>
                  <SelectItem value="available">Available on Servers</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Model Name</SelectItem>
                  <SelectItem value="servers">Server Count</SelectItem>
                  <SelectItem value="running">Running Count</SelectItem>
                  <SelectItem value="frequency">Execution Frequency</SelectItem>
                  <SelectItem value="size">Average Size</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Direction */}
              <Button
                variant="outline"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="gap-2"
              >
                {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model List */}
      <div id="models-section" className="space-y-4 max-w-6xl mx-auto">
        {/* Results Summary */}
        {filteredAndSortedModels.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-muted-foreground">
              Showing {indexOfFirstModel + 1}-{Math.min(indexOfLastModel, filteredAndSortedModels.length)} of {filteredAndSortedModels.length} models
            </div>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

        {filteredAndSortedModels.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Models Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms to find models.
              </p>
            </CardContent>
          </Card>
        ) : (
          currentModels.map((model) => (
            <Card key={model.modelName} className="overflow-hidden">
              <Collapsible
                open={expandedModels.has(model.modelName)}
                onOpenChange={() => toggleModelExpansion(model.modelName)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {expandedModels.has(model.modelName) ? 
                            <ChevronUp className="h-5 w-5" /> : 
                            <ChevronDown className="h-5 w-5" />
                          }
                          <CardTitle className="text-xl">{model.modelName}</CardTitle>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {model.runningServers > 0 ? (
                            <Badge variant="default" className="bg-green-500 gap-1">
                              <Play className="h-3 w-3" />
                              {model.runningServers} Running
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Square className="h-3 w-3" />
                              Stopped
                            </Badge>
                          )}
                          
                          <Badge variant="outline" className="gap-1">
                            <Server className="h-3 w-3" />
                            {model.totalServers} Servers
                          </Badge>
                          
                          <Badge variant="outline" className="gap-1">
                            <HardDrive className="h-3 w-3" />
                            {formatSize(model.averageSize)} avg
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last seen {formatTimestamp(model.lastActivity)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(model.executionFrequency * 100)}% execution rate
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{model.totalServers}</div>
                          <div className="text-sm text-muted-foreground">Total Servers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-500">{model.runningServers}</div>
                          <div className="text-sm text-muted-foreground">Currently Running</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-500">{formatSize(model.totalSize)}</div>
                          <div className="text-sm text-muted-foreground">Total Size</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          Server Locations ({model.servers.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {model.servers.map((serverInfo, index) => (
                            <Card key={`${serverInfo.server.ip}-${serverInfo.server.port}-${index}`} className="p-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="font-mono text-sm">
                                    {serverInfo.server.ip}:{serverInfo.server.port}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {serverInfo.isRunning ? (
                                      <Badge variant="default" className="bg-green-500 gap-1">
                                        <Play className="h-3 w-3" />
                                        Running
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="gap-1">
                                        <Square className="h-3 w-3" />
                                        Available
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{getCountryFlag(serverInfo.server.country)}</span>
                                  <span>{serverInfo.server.city}, {serverInfo.server.country_name}</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <HardDrive className="h-3 w-3" />
                                    {formatSize(serverInfo.modelSize)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTimestamp(serverInfo.lastSeen)}
                                  </span>
                                </div>
                                
                                <div className="text-xs text-muted-foreground">
                                  Version: {serverInfo.server.version} | 
                                  Status: {serverInfo.server.status}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {/* First page */}
              {currentPage > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink 
                      onClick={() => handlePageChange(1)}
                      isActive={currentPage === 1}
                      className="cursor-pointer"
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>
                  {currentPage > 4 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}
              
              {/* Page numbers around current page */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page >= Math.max(1, currentPage - 2) && 
                         page <= Math.min(totalPages, currentPage + 2);
                })
                .map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
              
              {/* Last page */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink 
                      onClick={() => handlePageChange(totalPages)}
                      isActive={currentPage === totalPages}
                      className="cursor-pointer"
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center mt-12">
        <p className="text-sm text-muted-foreground">
          Data refreshes automatically every 30 seconds. Last updated: {formatTimestamp(new Date().toISOString())}
        </p>
      </div>
    </section>
  );
};

export default ModelExecutionDashboard;