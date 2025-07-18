import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";
import ModelCard from './ModelCard';
import { ModelExecution } from '@/types/ModelExecution';

interface ModelListProps {
  models: ModelExecution[];
  expandedModels: Set<string>;
  toggleModelExpansion: (modelName: string) => void;
  indexOfFirstModel: number;
  indexOfLastModel: number;
  totalModels: number;
  currentPage: number;
  totalPages: number;
}

const ModelList: React.FC<ModelListProps> = ({
  models,
  expandedModels,
  toggleModelExpansion,
  indexOfFirstModel,
  indexOfLastModel,
  totalModels,
  currentPage,
  totalPages,
}) => {
  return (
    <div id="models-section" className="space-y-4 max-w-6xl mx-auto">
      {/* Results Summary */}
      {totalModels > 0 && (
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-muted-foreground">
            Showing {indexOfFirstModel + 1}-{Math.min(indexOfLastModel, totalModels)} of {totalModels} models
          </div>
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {models.length === 0 ? (
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
        models.map((model) => (
          <ModelCard
            key={model.metadata.modelName}
            model={model}
            isExpanded={expandedModels.has(model.metadata.modelName)}
            toggleExpansion={toggleModelExpansion}
          />
        ))
      )}
    </div>
  );
};

export default ModelList;
