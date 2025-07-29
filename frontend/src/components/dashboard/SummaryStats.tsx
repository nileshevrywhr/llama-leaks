import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import AnimatedCounter from '../AnimatedCounter';
import { ModelExecution, ServerData } from '@/types/ModelExecution';
import { calculateActiveExecutions, calculateTotalModelSize } from '@/utils/stats-calculator';
import { formatBytesToGB } from '@/utils/formatting';

interface SummaryStatsProps {
  modelExecutions: ModelExecution[];
  serverData: ServerData[];
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ modelExecutions, serverData }) => {
  const activeExecutions = calculateActiveExecutions(modelExecutions);
  const totalModelSizeBytes = calculateTotalModelSize(modelExecutions);
  const totalModelSizeGB = formatBytesToGB(totalModelSizeBytes);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-primary">
            <AnimatedCounter target={modelExecutions.length} duration={1500} />
          </div>
          <div className="text-sm text-muted-foreground">Unique Models</div>
        </CardContent>
      </Card>

      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-green-500">
            <AnimatedCounter
              target={activeExecutions}
              duration={1500}
            />
          </div>
          <div className="text-sm text-muted-foreground">Active Executions</div>
        </CardContent>
      </Card>

      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-blue-500">
            <AnimatedCounter target={serverData.length} duration={1500} />
          </div>
          <div className="text-sm text-muted-foreground">Total Servers</div>
        </CardContent>
      </Card>

      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="text-2xl font-bold text-orange-500">
            <AnimatedCounter
              target={totalModelSizeGB}
              duration={1500}
            />
            <span className="text-sm font-normal">GB</span>
          </div>
          <div className="text-sm text-muted-foreground">Total Model Size</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryStats;
