import React, { useState, useEffect, useMemo } from 'react';
import { ServerData, ModelExecution, SortOption, SortDirection, StatusFilter } from '@/types/ModelExecution';
import BasePage from './dashboard/BasePage';
import SummaryStats from './dashboard/SummaryStats';
import FilterControls from './dashboard/FilterControls';
import ModelList from './dashboard/ModelList';
import PaginationControls from './dashboard/PaginationControls';
import { formatDistanceToNowStrict } from "date-fns";

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
            averageSize: 0,
            totalServers: 0,
            runningServers: 0,
            totalSize: 0,
            servers: [],
            lastActivity: server.last_observed,
            executionFrequency: 0,
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
            averageSize: 0,
            totalServers: 0,
            runningServers: 0,
            totalSize: 0,
            servers: [],
            lastActivity: server.last_observed,
            executionFrequency: 0,
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
      execution.averageSize = execution.totalServers > 0 ? execution.totalSize / execution.totalServers : 0;
      execution.executionFrequency = execution.totalServers > 0 ? execution.runningServers / execution.totalServers : 0;
    });
    
    return Array.from(modelMap.values());
  }, [serverData]);

  // Reset current page when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, serverFilter, statusFilter, sortBy, sortDirection]);

  const filteredAndSortedModels = useMemo(() => {
    const filtered = modelExecutions.filter(model => {
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

  return (
    <BasePage loading={loading} error={error} retry={() => fetchServerData()}>
      <SummaryStats
        modelExecutions={modelExecutions}
        serverData={serverData}
      />
      <FilterControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        serverFilter={serverFilter}
        setServerFilter={setServerFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        uniqueServers={uniqueServers}
        refreshing={refreshing}
        handleRefresh={handleRefresh}
      />
      <ModelList
        models={currentModels}
        expandedModels={expandedModels}
        toggleModelExpansion={toggleModelExpansion}
        indexOfFirstModel={indexOfFirstModel}
        indexOfLastModel={indexOfLastModel}
        totalModels={filteredAndSortedModels.length}
        currentPage={currentPage}
        totalPages={totalPages}
      />
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        handlePageChange={handlePageChange}
      />
      <div className="text-center mt-12">
        <p className="text-sm text-muted-foreground">
          Data refreshes automatically every 30 seconds. Last updated: {formatDistanceToNowStrict(new Date(), { addSuffix: true })}
        </p>
      </div>
    </BasePage>
  );
};

export default ModelExecutionDashboard;