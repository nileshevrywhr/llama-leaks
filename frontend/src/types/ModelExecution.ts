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

export interface ModelExecution {
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

export type SortOption = 'name' | 'servers' | 'running' | 'frequency' | 'size';
export type SortDirection = 'asc' | 'desc';
export type StatusFilter = 'all' | 'running' | 'stopped' | 'available';
