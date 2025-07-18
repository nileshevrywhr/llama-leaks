import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Play,
  Square,
  Server,
  Clock,
  HardDrive
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { ModelExecution, ModelMetadata, ServerAggregation, ExecutionStatistics } from '@/types/ModelExecution';
import { formatSize } from "@/lib/utils";

interface ModelCardProps {
  model: ModelExecution;
  isExpanded: boolean;
  toggleExpansion: (modelName: string) => void;
}

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

const ModelCard: React.FC<ModelCardProps> = ({ model, isExpanded, toggleExpansion }) => {
  return (
    <Card key={model.metadata.modelName} className="overflow-hidden">
      <Collapsible
        open={isExpanded}
        onOpenChange={() => toggleExpansion(model.metadata.modelName)}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {isExpanded ?
                    <ChevronUp className="h-5 w-5" /> :
                    <ChevronDown className="h-5 w-5" />
                  }
                  <CardTitle className="text-xl">{model.metadata.modelName}</CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  {model.aggregation.runningServers > 0 ? (
                    <Badge variant="default" className="bg-green-500 gap-1">
                      <Play className="h-3 w-3" />
                      {model.aggregation.runningServers} Running
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Square className="h-3 w-3" />
                      Stopped
                    </Badge>
                  )}

                  <Badge variant="outline" className="gap-1">
                    <Server className="h-3 w-3" />
                    {model.aggregation.totalServers} Servers
                  </Badge>

                  <Badge variant="outline" className="gap-1">
                    <HardDrive className="h-3 w-3" />
                    {formatSize(model.metadata.averageSize)} avg
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last seen {formatTimestamp(model.statistics.lastActivity)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(model.statistics.executionFrequency * 100)}% execution rate
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
                  <div className="text-2xl font-bold text-primary">{model.aggregation.totalServers}</div>
                  <div className="text-sm text-muted-foreground">Total Servers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{model.aggregation.runningServers}</div>
                  <div className="text-sm text-muted-foreground">Currently Running</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{formatSize(model.aggregation.totalSize)}</div>
                  <div className="text-sm text-muted-foreground">Total Size</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Server Locations ({model.aggregation.servers.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {model.aggregation.servers.map((serverInfo, index) => (
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
  );
};

export default ModelCard;
