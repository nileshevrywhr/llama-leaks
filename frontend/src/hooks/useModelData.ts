import { useState, useEffect, useMemo } from 'react';
import { ServerData, ModelExecution } from '@/types/ModelExecution';

export const useModelData = () => {
  const [serverData, setServerData] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      setLastUpdated(new Date());
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

    const interval = setInterval(() => {
      fetchServerData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const modelExecutions = useMemo(() => {
    const modelMap = new Map<string, ModelExecution>();

    serverData.forEach(server => {
      server.local.forEach(model => {
        const key = model.name;
        if (!modelMap.has(key)) {
          modelMap.set(key, {
            metadata: { modelName: model.name, averageSize: 0 },
            aggregation: { totalServers: 0, runningServers: 0, totalSize: 0, servers: [] },
            statistics: { lastActivity: server.last_observed, executionFrequency: 0 },
          });
        }

        const execution = modelMap.get(key)!;
        const isRunning = server.running.some(runningModel => runningModel.name === model.name);

        execution.aggregation.servers.push({
          server,
          isRunning,
          isLocal: true,
          modelSize: model.size,
          lastSeen: server.last_observed
        });

        execution.aggregation.totalServers++;
        if (isRunning) execution.aggregation.runningServers++;
        execution.aggregation.totalSize += model.size;

        if (new Date(server.last_observed) > new Date(execution.statistics.lastActivity)) {
          execution.statistics.lastActivity = server.last_observed;
        }
      });

      server.running.forEach(model => {
        const key = model.name;
        if (!modelMap.has(key)) {
          modelMap.set(key, {
            metadata: { modelName: model.name, averageSize: 0 },
            aggregation: { totalServers: 0, runningServers: 0, totalSize: 0, servers: [] },
            statistics: { lastActivity: server.last_observed, executionFrequency: 0 },
          });
        }

        const execution = modelMap.get(key)!;
        const existingServer = execution.aggregation.servers.find(s => s.server.ip === server.ip && s.server.port === server.port);

        if (!existingServer) {
          execution.aggregation.servers.push({
            server,
            isRunning: true,
            isLocal: false,
            modelSize: model.size,
            lastSeen: server.last_observed
          });

          execution.aggregation.totalServers++;
          execution.aggregation.runningServers++;
          execution.aggregation.totalSize += model.size;
        }
      });
    });

    modelMap.forEach(execution => {
      execution.metadata.averageSize = execution.aggregation.totalServers > 0 ? execution.aggregation.totalSize / execution.aggregation.totalServers : 0;
      execution.statistics.executionFrequency = execution.aggregation.totalServers > 0 ? execution.aggregation.runningServers / execution.aggregation.totalServers : 0;
    });

    return Array.from(modelMap.values());
  }, [serverData]);

  const uniqueServers = useMemo(() => {
    const servers = new Set<string>();
    serverData.forEach(server => {
      servers.add(`${server.ip}:${server.port}`);
      servers.add(server.city);
      servers.add(server.country_name);
    });
    return Array.from(servers).sort();
  }, [serverData]);

  return {
    serverData,
    loading,
    error,
    refreshing,
    lastUpdated,
    modelExecutions,
    uniqueServers,
    fetchServerData,
  };
};
