import React, { useState } from 'react';
import { useModelData } from '@/hooks/useModelData';
import { useModelFilters } from '@/hooks/useModelFilters';
import { useTimeSince } from '@/hooks/useTimeSince';
import BasePage from './dashboard/BasePage';
import SummaryStats from './dashboard/SummaryStats';
import FilterControls from './dashboard/FilterControls';
import ModelList from './dashboard/ModelList';
import PaginationControls from './dashboard/PaginationControls';

const ModelExecutionDashboard = () => {
  const {
    serverData,
    loading,
    error,
    refreshing,
    lastUpdated,
    modelExecutions,
    uniqueServers,
    fetchServerData,
  } = useModelData();

  const {
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
  } = useModelFilters(modelExecutions);

  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const modelsPerPage = 10;
  const timeSinceUpdate = useTimeSince(lastUpdated);

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
    const modelsSection = document.getElementById('models-section');
    if (modelsSection) {
      modelsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
          Data refreshes automatically every 30 seconds. Last updated: {lastUpdated ? `${timeSinceUpdate} seconds ago` : 'never'}
        </p>
      </div>
    </BasePage>
  );
};

export default ModelExecutionDashboard;