'use server';

import { intelligentSwitchControl, IntelligentSwitchControlInput } from '@/ai/flows/intelligent-switch-control';
import { predictEnergyConsumption, PredictEnergyConsumptionOutput } from '@/ai/flows/predict-energy-consumption';
import { HISTORICAL_DATA } from '@/lib/data';
import { get, getDatabase, ref, set, update } from 'firebase/database';
import { initializeFirebase } from '@/firebase';
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


export async function generateApiKey(userId: string) {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  try {
    const { database } = initializeFirebase();
    const apiKey = randomUUID();
    const userRef = ref(database, `users/${userId}`);
    
    await update(userRef, { apiKey });
    
    return { success: true, data: { apiKey } };
  } catch (error: any) {
    console.error('Error generating API key:', error);
    return { success: false, error: error.message || 'Failed to generate API key.' };
  }
}

export async function getApiKey(userId: string) {
    if (!userId) {
      return { success: false, error: 'User not authenticated.' };
    }
    try {
      const { database } = initializeFirebase();
      const userRef = ref(database, `users/${userId}/apiKey`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return { success: true, data: { apiKey: snapshot.val() } };
      }
      return { success: true, data: { apiKey: null } };
    } catch (error: any) {
      console.error('Error fetching API key:', error);
      return { success: false, error: error.message || 'Failed to fetch API key.' };
    }
}

export async function updateSwitchState(userId: string, switchId: number, name: string, state: boolean) {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }
  try {
    const { database } = initializeFirebase();
    const switchRef = ref(database, `users/${userId}/switchStates/switch${switchId}`);
    
    await set(switchRef, { name, state, timestamp: new Date().toISOString() });
    
    return { success: true };
  } catch (error: any) {
    console.error(`Error updating switch ${switchId}:`, error);
    return { success: false, error: error.message || `Failed to update switch ${switchId}.` };
  }
}
