import type { SwitchState, HistoricalDataPoint, EnergyData } from '@/lib/types';

export const INITIAL_ENERGY_DATA: EnergyData = {
  voltage: 230.5,
  current: 5.2,
  batteryLevel: 85,
  power: 1198.6,
  temperature: 25.5,
  humidity: 60,
  totalConsumption: 1234.5,
  energyRemain: 45.2,
};

export const INITIAL_SWITCHES: SwitchState[] = [
  { id: 1, name: 'Switch 1', state: true },
  { id: 2, name: 'Switch 2', state: false },
  { id: 3, name: 'Switch 3', state: false },
  { id: 4, name: 'Switch 4', state: true },
  { id: 5, name: 'Switch 5', state: false },
];

export const HISTORICAL_DATA: HistoricalDataPoint[] = [
  { month: 'Jan', consumption: 186, generation: 220 },
  { month: 'Feb', consumption: 205, generation: 240 },
  { month: 'Mar', consumption: 237, generation: 280 },
  { month: 'Apr', consumption: 173, generation: 300 },
  { month: 'May', consumption: 209, generation: 320 },
  { month: 'Jun', consumption: 250, generation: 350 },
  { month: 'Jul', consumption: 280, generation: 360 },
  { month: 'Aug', consumption: 260, generation: 340 },
  { month: 'Sep', consumption: 220, generation: 290 },
  { month: 'Oct', consumption: 190, generation: 250 },
  { month: 'Nov', consumption: 170, generation: 210 },
  { month: 'Dec', consumption: 210, generation: 190 },
];
