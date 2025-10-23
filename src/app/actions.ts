'use server';

import { intelligentSwitchControl, IntelligentSwitchControlInput } from '@/ai/flows/intelligent-switch-control';
import { predictEnergyConsumption, PredictEnergyConsumptionOutput } from '@/ai/flows/predict-energy-consumption';
import { HISTORICAL_DATA } from '@/lib/data';

export async function runIntelligentSwitchControl(input: IntelligentSwitchControlInput) {
  try {
    const result = await intelligentSwitchControl(input);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in intelligentSwitchControl:', error);
    return { success: false, error: 'Failed to get intelligent recommendations.' };
  }
}

export async function runEnergyPrediction() {
  try {
    const historicalDataString = JSON.stringify(HISTORICAL_DATA);
    const result = await predictEnergyConsumption({
      historicalData: historicalDataString,
      modelName: 'energy_consumption_v1',
    });
    return { success: true, data: result as PredictEnergyConsumptionOutput };
  } catch (error) {
    console.error('Error in predictEnergyConsumption:', error);
    return { success: false, error: 'Failed to predict energy consumption.' };
  }
}
