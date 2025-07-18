import { ModelExecution } from '@/types/ModelExecution';

export const calculateActiveExecutions = (modelExecutions: ModelExecution[]): number => {
  return modelExecutions.reduce((sum, model) => sum + model.runningServers, 0);
};

export const calculateTotalModelSize = (modelExecutions: ModelExecution[]): number => {
  return modelExecutions.reduce((sum, model) => sum + model.totalSize, 0);
};
