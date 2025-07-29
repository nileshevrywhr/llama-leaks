export interface ServerModel {
  name: string;
  model: string;
  size: number;
}

export interface ServerData {
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

export interface ModelMetadata {
  modelName: string;
  averageSize: number;
}

export interface ServerAggregation {
  totalServers: number;
  runningServers: number;
  totalSize: number;
  servers: {
    server: ServerData;
    isRunning: boolean;
    isLocal: boolean;
    modelSize: number;
    lastSeen: string;
  }[];
}

export interface ExecutionStatistics {
  lastActivity: string;
  executionFrequency: number;
}

export interface ModelExecution {
  metadata: ModelMetadata;
  aggregation: ServerAggregation;
  statistics: ExecutionStatistics;
}

export type SortOption = 'name' | 'servers' | 'running' | 'frequency' | 'size';
export type SortDirection = 'asc' | 'desc';
export type StatusFilter = 'all' | 'running' | 'stopped' | 'available';
