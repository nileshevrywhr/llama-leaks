import { ModelExecution } from '@/types/ModelExecution';
import { convertBytesToGB } from '@/lib/utils';

export const calculateActiveExecutions = (modelExecutions: ModelExecution[]): number => {
  return modelExecutions.reduce((sum, model) => sum + model.aggregation.runningServers, 0);
};

export const calculateTotalModelSize = (modelExecutions: ModelExecution[]): number => {
  const totalSizeInBytes = modelExecutions.reduce((sum, model) => sum + model.metadata.averageSize, 0);
  return totalSizeInBytes;
};
