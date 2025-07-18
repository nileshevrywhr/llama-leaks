export const formatBytesToGB = (bytes: number): number => {
  return Math.round(bytes / (1024 * 1024 * 1024));
};
