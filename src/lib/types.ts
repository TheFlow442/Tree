export type EnergyData = {
  voltage: number;
  current: number;
  batteryLevel: number;
  power: number;
  temperature: number;
  humidity: number;
  totalConsumption: number;
  energyRemain: number;
};

export type SwitchState = {
  id: number;
  name: string;
  state: boolean;
};

export type HistoricalDataPoint = {
  month: string;
  "Energy Consumption (kWh)": number;
};

export type Prediction = {
  predictedConsumption: number;
  confidenceInterval: number;
  analysis: string;
};
