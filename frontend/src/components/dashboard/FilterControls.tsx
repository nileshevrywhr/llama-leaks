import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
} from "lucide-react";
import { SortOption, SortDirection, StatusFilter } from '@/types/ModelExecution';

interface FilterControlsProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  serverFilter: string;
  setServerFilter: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  sortDirection: SortDirection;
  setSortDirection: (value: SortDirection) => void;
  uniqueServers: string[];
  refreshing: boolean;
  handleRefresh: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
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
  uniqueServers,
  refreshing,
  handleRefresh,
}) => {
  return (
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
  );
};

export default FilterControls;
