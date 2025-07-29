import { useState, useMemo, useEffect } from 'react';
import { ModelExecution, SortOption, SortDirection, StatusFilter } from '@/types/ModelExecution';

export const useModelFilters = (
  modelExecutions: ModelExecution[],
  initialSortBy: SortOption = 'servers',
  initialSortDirection: SortDirection = 'desc'
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serverFilter, setServerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>(initialSortBy);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, serverFilter, statusFilter, sortBy, sortDirection]);

  const filteredAndSortedModels = useMemo(() => {
    const filtered = modelExecutions.filter(model => {
      if (searchTerm && !model.metadata.modelName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (serverFilter !== 'all') {
        const hasServer = model.aggregation.servers.some(s =>
          `${s.server.ip}:${s.server.port}` === serverFilter ||
          s.server.city.toLowerCase().includes(serverFilter.toLowerCase()) ||
          s.server.country_name.toLowerCase().includes(serverFilter.toLowerCase())
        );
        if (!hasServer) return false;
      }

      switch (statusFilter) {
        case 'running':
          return model.aggregation.runningServers > 0;
        case 'stopped':
          return model.aggregation.runningServers === 0 && model.aggregation.totalServers > 0;
        case 'available':
          return model.aggregation.totalServers > 0;
        default:
          return true;
      }
    });

    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'name':
          aValue = a.metadata.modelName.toLowerCase();
          bValue = b.metadata.modelName.toLowerCase();
          break;
        case 'servers':
          aValue = a.aggregation.totalServers;
          bValue = b.aggregation.totalServers;
          break;
        case 'running':
          aValue = a.aggregation.runningServers;
          bValue = b.aggregation.runningServers;
          break;
        case 'frequency':
          aValue = a.statistics.executionFrequency;
          bValue = b.statistics.executionFrequency;
          break;
        case 'size':
          aValue = a.metadata.averageSize;
          bValue = b.metadata.averageSize;
          break;
        default:
          aValue = a.aggregation.totalServers;
          bValue = b.aggregation.totalServers;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [modelExecutions, searchTerm, serverFilter, statusFilter, sortBy, sortDirection]);

  return {
    searchTerm,
    setSearchTerm,
    serverFilter,
    setServerFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    filteredAndSortedModels,
  };
};
