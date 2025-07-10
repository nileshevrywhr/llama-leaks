import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, AlertTriangle, Shuffle, AlertCircle, Zap, Eye, Clock, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import Map from "./Map";
import { formatDistanceToNowStrict } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

const Hero = () => {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelsExpanded, setModelsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

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
      const serverEntries = Object.values(serversObject) as ServerData[];
      
      if (serverEntries.length === 0) {
        throw new Error('No servers found in the data');
      }
      
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

  const handleCopyUrl = async () => {
    if (!serverData) return;
    
    const serverUrl = `http://${serverData.ip}:${serverData.port}`;
    
    try {
      // Try the modern Clipboard API first
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(serverUrl);
      } else {
        // Fallback for browsers that don't support the Clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = serverUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy server URL: ', err);
    }
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
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
    return {
      formatted: `${month} ${day}, ${year} | ${time} UTC`,
      distance: formatDistanceToNowStrict(date, { addSuffix: true }),
    };
  };

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

  if (loading) {
    return (
      <section className="container flex flex-col items-center justify-center space-y-6 py-16 md:py-20 mt-4">
        <h1 className="text-2xl font-bold leading-tight tracking-tighter md:text-4xl lg:text-5xl lg:leading-[1.1] text-center max-w-3xl">
          Your Ollama Server is Now a{" "}
          <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            Public AI Playground
          </span>
        </h1>
        
        <p className="max-w-xl text-center text-base text-muted-foreground md:text-lg">
          Your server is cheerfully entertaining prompts from the entire internet. 
          No authentication required. Here's proof:
        </p>

        <div className="w-full max-w-4xl bg-muted rounded-lg h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading live evidence...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !serverData) {
    return (
      <section className="container flex flex-col items-center justify-center space-y-6 py-16 md:py-20 mt-4">
        <h1 className="text-2xl font-bold leading-tight tracking-tighter md:text-4xl lg:text-5xl lg:leading-[1.1] text-center max-w-3xl">
          Your Ollama Server is Now a{" "}
          <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            Public AI Playground
          </span>
        </h1>
        
        <div className="w-full max-w-4xl bg-destructive/5 border border-destructive/20 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 mb-4 text-destructive mx-auto" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Unable to Load Server Information</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchRandomServer()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Shuffle className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </section>
    );
  }

  const timestamp = formatTimestamp(serverData.last_observed);
  const firstSeen = formatTimestamp(serverData.first_seen_online);

  return (
    <section className="container flex flex-col items-center justify-center space-y-6 py-12 md:py-16 mt-2">
      {/* Hero Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold leading-tight tracking-tighter md:text-4xl lg:text-4xl xl:text-5xl lg:leading-[1.1] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center lg:whitespace-nowrap">
          Your Ollama Server is Now a{" "}
          <span className="bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
            Public AI Playground
          </span>
        </h1>
        
        <div className="max-w-3xl mx-auto text-sm text-muted-foreground md:text-base mt-3 space-y-2 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base sm:text-lg font-semibold text-foreground/90 lg:whitespace-nowrap">
            Zero security. No asterisks. Just public endpoints serving AI models to anyone who asks nicely.
          </p>
        </div>
      </div>

      {/* Integrated Location Evidence */}
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-stretch">
          {/* Map */}
          <div className="w-full h-40 sm:h-48 lg:h-96 min-h-[160px] sm:min-h-[192px] lg:min-h-[384px] max-h-[500px]">
            <Map 
              latitude={serverData.latitude}
              longitude={serverData.longitude}
              city={serverData.city}
              country={serverData.country_name}
            />
          </div>

          {/* Server Information */}
          <div className="w-full h-auto lg:h-96 lg:min-h-[384px] lg:max-h-[500px] bg-background/80 dark:bg-slate-900/80 backdrop-blur-sm border border-border text-foreground rounded-lg font-mono flex flex-col">
            {/* Header with Refresh Button */}
            <div className="flex items-center justify-between p-3 lg:p-6 pb-2 lg:pb-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2 text-muted-foreground text-xs lg:text-xs">
                <Clock className="w-3 h-3" />
                <span className="hidden sm:inline">AS OF {timestamp.formatted} ({timestamp.distance})</span>
                <span className="sm:hidden">{timestamp.formatted.split('|')[0]} ({timestamp.distance})</span>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                size="sm"
                variant="outline"
                className="relative overflow-hidden transition-all duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background"
                aria-label={refreshing ? "Loading new server data" : "Load new random server"}
              >
                <Shuffle 
                  className={`h-4 w-4 transition-transform duration-200 ${
                    refreshing ? 'animate-pulse' : 'group-hover:scale-110'
                  }`} 
                />
                <span className="ml-2 hidden lg:inline">
                  {refreshing ? 'Loading...' : 'Random'}
                </span>
                {refreshing && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse" />
                )}
              </Button>
            </div>

            {/* Server Details - Scrollable Content */}
            <div className="flex-1 lg:overflow-y-auto px-3 lg:px-6 pt-2 lg:pt-4 pb-3 lg:pb-6 space-y-2 lg:space-y-4 lg:scrollbar-thin lg:scrollbar-thumb-border lg:scrollbar-track-transparent">
              {/* URL Field with Copy Button - Single Row */}
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <span className="text-xs lg:text-sm text-muted-foreground font-mono">
                    http://
                  </span>
                  <span className="text-primary text-sm lg:text-lg font-medium font-mono truncate">
                    {serverData.ip}:{serverData.port}
                  </span>
                </div>
                <Button
                  onClick={handleCopyUrl}
                  size="sm"
                  variant="outline"
                  className={`
                    relative overflow-hidden transition-all duration-200 flex-shrink-0
                    hover:bg-primary hover:text-primary-foreground hover:border-primary
                    focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
                    active:scale-95 font-mono text-xs
                    ${copied ? 'bg-green-500 text-white border-green-500' : ''}
                  `}
                  disabled={!serverData}
                  aria-label={copied ? "URL copied to clipboard" : "Copy server URL to clipboard"}
                  title={copied ? "Copied!" : "Copy URL"}
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full animate-pulse" />
                  )}
                </Button>
              </div>

              {/* Location */}
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">{getCountryFlag(serverData.country)}</span>
                <div className="text-foreground text-xs lg:text-sm">
                  <div className="lg:hidden">
                    <div>{serverData.city}, {serverData.country_name}</div>
                    <div className="text-muted-foreground">{serverData.region}</div>
                  </div>
                  <div className="hidden lg:block">
                    {serverData.country} / {serverData.country_name} / {serverData.region} / {serverData.city}
                  </div>
                </div>
              </div>

              {/* Protocol and Version with Age */}
              <div className="grid grid-cols-2 gap-2 lg:space-y-1 lg:block text-xs lg:text-xs">
                <div className="flex items-center gap-2">
                  <div>
                    <span className="text-muted-foreground">Version: </span>
                    <span className="text-primary">{serverData.version}</span>
                  </div>
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
                <div className="col-span-2 lg:col-span-1 lg:mt-1">
                  <span className="text-muted-foreground">First Seen: </span>
                  <span className="text-primary">{firstSeen.formatted} ({firstSeen.distance})</span>
                </div>
              </div>

              {/* Collapsible Model Details - Mobile Only */}
              <div className="lg:hidden">
                <Collapsible open={modelsExpanded} onOpenChange={setModelsExpanded}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <span>Model Details</span>
                    {modelsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {/* Local Models */}
                    {serverData.local.length > 0 && (
                      <div>
                        <div className="text-accent text-xs mb-1">Local Models ({serverData.local.length})</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {serverData.local.map((model, index) => (
                            <div key={index} className="truncate">
                              {model.name} ({formatSize(model.size)})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Running Models */}
                    {serverData.running.length > 0 && (
                      <div>
                        <div className="text-accent text-xs mb-1">Running ({serverData.running.length})</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {serverData.running.map((model, index) => (
                            <div key={index} className="truncate">
                              {model.name} ({formatSize(model.size)})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Desktop Model Details - Always Expanded */}
              <div className="hidden lg:block space-y-2">
                <div>
                  <div className="text-accent text-xs mb-1">Local Models ({serverData.local.length})</div>
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

                <div>
                  <div className="text-accent text-xs mb-1">Running ({serverData.running.length})</div>
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
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="mt-4 lg:mt-8 p-4 lg:p-6 bg-gradient-to-br from-destructive/5 to-orange-500/5 border border-destructive/20 rounded-xl">
          <div className="text-center space-y-6">
            <div className="space-y-1">
              <h3 className="text-base lg:text-lg font-semibold text-destructive">
                What Could Someone Do With This Access?
              </h3>
              <div className="text-muted-foreground text-xs lg:text-sm max-w-2xl mx-auto space-y-1">
                <p className="text-center">
                  <span className="md:inline block">These servers are completely open.</span>
                  <span className="md:inline block"> Here's what a malicious actor could potentially do:</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center max-w-lg mx-auto">
              <Button 
                variant="destructive" 
                size="default"
                className="flex-1 gap-2 bg-destructive/90 hover:bg-destructive transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled
                title="Educational purposes only - not functional"
              >
                <Eye className="h-5 w-5" />
                Generate Malicious Content
              </Button>
              
              <Button 
                variant="destructive" 
                size="default"
                className="flex-1 gap-2 bg-gradient-to-r from-destructive to-orange-600 hover:from-destructive/90 hover:to-orange-600/90 transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled
                title="Educational purposes only - not functional"
              >
                <Zap className="h-5 w-5" />
                Replace with Evil Model
              </Button>
            </div>
            
            <div className="text-xs lg:text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-center">🛡️ Don't worry - these buttons don't actually do anything harmful.</p>
              <p className="text-center">This is purely educational to demonstrate the security implications of exposed AI servers.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;