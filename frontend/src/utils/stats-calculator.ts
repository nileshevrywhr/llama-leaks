import { ModelExecution } from '@/types/ModelExecution';

export const calculateActiveExecutions = (modelExecutions: ModelExecution[]): number => {
  return modelExecutions.reduce((sum, model) => sum + model.aggregation.runningServers, 0);
};

export const calculateTotalModelSize = (modelExecutions: ModelExecution[]): number => {
  return Math.round(modelExecutions.reduce((sum, model) => sum + model.aggregation.totalSize, 0) / (1024 * 1024 * 1024));
};
