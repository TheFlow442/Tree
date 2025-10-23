import type { EnergyData } from '@/lib/types';
import { EnergyMetric } from './energy-metric';

type EnergyMetricsProps = {
  energyData: EnergyData;
};

export function EnergyMetrics({ energyData }: EnergyMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <EnergyMetric label="Voltage" value={`${energyData.voltage} V`} />
      <EnergyMetric label="Current" value={`${energyData.current} A`} />
      <EnergyMetric label="Power" value={`${energyData.power} W`} />
      <EnergyMetric label="Battery" value={`${energyData.batteryLevel}%`} batteryLevel={energyData.batteryLevel} />
    </div>
  );
}
