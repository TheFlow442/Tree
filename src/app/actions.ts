'use server';

import { intelligentSwitchControl, IntelligentSwitchControlInput } from '@/ai/flows/intelligent-switch-control';
import { predictEnergyConsumption, PredictEnergyConsumptionOutput } from '@/ai/flows/predict-energy-consumption';
import { HISTORICAL_DATA } from '@/lib/data';
import { randomUUID } from 'crypto';

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

// NOTE: The following functions are not currently wired up to the frontend
// but are kept for reference. They would require Firebase to be fully integrated.

export async function generateApiKey() {
  try {
    const apiKey = randomUUID();
    // In a real implementation, you would save this to your database.
    console.log(`Generated API Key: ${apiKey}`);
    return { success: true, data: { apiKey } };
  } catch (error: any) {
    console.error('Error generating API key:', error);
    return { success: false, error: error.message || 'Failed to generate API key.' };
  }
}

export async function getApiKey() {
    try {
      // In a real implementation, you would fetch this from your database.
      console.log('Fetching API Key...');
      return { success: true, data: { apiKey: 'dummy-api-key-to-be-replaced' } };
    } catch (error: any) {
      console.error('Error fetching API key:', error);
      return { success: false, error: error.message || 'Failed to fetch API key.' };
    }
}

export async function updateSwitchState(switchId: number, name: string, state: boolean) {
  try {
    // In a real implementation, you would update this in your database.
    console.log(`Updating switch ${switchId} (${name}) to ${state}`);
    return { success: true };
  } catch (error: any) {
    console.error(`Error updating switch ${switchId}:`, error);
    return { success: false, error: error.message || `Failed to update switch ${switchId}.` };
  }
}

export async function getSwitchStates() {
  try {
    // In a real implementation, you would fetch this from your database.
    console.log('Fetching switch states...');
    return { success: true, data: null };
  } catch (error: any) {
    console.error('Error fetching switch states:', error);
    return { success: false, error: error.message || 'Failed to fetch switch states.' };
  }
}
