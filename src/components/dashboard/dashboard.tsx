"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { runEnergyPrediction, runIntelligentSwitchControl, updateSwitchState, getSwitchStates } from '@/app/actions';
import { INITIAL_ENERGY_DATA, INITIAL_SWITCHES } from '@/lib/data';
import type { EnergyData, SwitchState } from '@/lib/types';
import { EnergyMetrics } from './energy-metrics';
import { SwitchControl } from './switch-control';
import { UsageHistory } from './usage-history';
import { PredictionAnalytics } from './prediction-analytics';
import type { PredictEnergyConsumptionOutput } from '@/ai/flows/predict-energy-consumption';
import { ref, onValue } from 'firebase/database';
import { useDatabase } from '@/firebase';

export function Dashboard() {
  const [energyData, setEnergyData] = useState<EnergyData>(INITIAL_ENERGY_DATA);
  const [switches, setSwitches] = useState<SwitchState[]>(INITIAL_SWITCHES);
  const [userPreferences, setUserPreferences] = useState('Prioritize extending battery life and reducing cost. Only turn on essential appliances if battery is below 40%.');
  const [prediction, setPrediction] = useState<PredictEnergyConsumptionOutput | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const { toast } = useToast();
  const database = useDatabase();

  useEffect(() => {
    // Fetch initial switch states
    getSwitchStates().then(result => {
      if (result.success && result.data) {
        const firebaseSwitches = result.data;
        const updatedSwitches = INITIAL_SWITCHES.map(s => ({
          ...s,
          state: firebaseSwitches[`switch${s.id}`]?.state ?? s.state,
        }));
        setSwitches(updatedSwitches);
      }
    });

    // Listen for real-time switch state changes
    const switchStatesRef = ref(database, 'app/switchStates');
    const unsubscribeSwitches = onValue(switchStatesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSwitches(prevSwitches => prevSwitches.map(s => ({
          ...s,
          state: data[`switch${s.id}`]?.state ?? s.state
        })));
      }
    });

    // Listen for real-time energy data changes
    const energyDataRef = ref(database, 'app/energyData');
     const unsubscribeEnergy = onValue(energyDataRef, (snapshot) => {
       const data = snapshot.val();
       if (data) {
        const lastDataPoint = Object.values(data).pop() as any;
        if (lastDataPoint) {
            setEnergyData(prev => ({
                ...prev, // keep some existing state if not provided
                voltage: lastDataPoint.voltage ?? prev.voltage,
                current: lastDataPoint.current ?? prev.current,
                batteryLevel: lastDataPoint.batteryLevel ?? prev.batteryLevel,
                power: lastDataPoint.power ?? (lastDataPoint.voltage * lastDataPoint.current) ?? prev.power,
                temperature: lastDataPoint.temperature ?? prev.temperature,
                humidity: lastDataPoint.humidity ?? prev.humidity,
             }));
        }
       }
     });

    handlePrediction(); // Initial prediction on load
    
    return () => {
      unsubscribeSwitches();
      unsubscribeEnergy();
    };
  }, [database]);

  const handlePrediction = async () => {
    setIsPredictionLoading(true);
    setAiReasoning('');
    const result = await runEnergyPrediction();
    if (result.success && result.data) {
      setPrediction(result.data);
      toast({
        title: "Prediction Ready",
        description: "Future energy consumption has been forecasted.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Prediction Failed",
        description: result.error,
      });
    }
    setIsPredictionLoading(false);
  };
  
  const updateAllSwitches = useCallback(async (newSwitchStates: boolean[]) => {
    const updatedSwitches = switches.map((s, i) => ({
      ...s,
      state: newSwitchStates[i],
    }));

    // Optimistically update UI
    setSwitches(updatedSwitches);

    // Update all switches in Firebase
    for (const s of updatedSwitches) {
      // We don't need to await here as the listener will catch the update
      updateSwitchState(s.id, s.name, s.state);
    }
  }, [switches]);


  const handleOptimization = async () => {
    if (!prediction) {
      toast({
        variant: "destructive",
        title: "Cannot Optimize",
        description: "Please predict energy consumption first.",
      });
      return;
    }
    setIsOptimizing(true);
    const result = await runIntelligentSwitchControl({
      ...energyData,
      predictedUsage: prediction.predictedConsumption,
      userPreferences,
      userUsagePatterns: prediction.userUsagePatterns,
    });

    if (result.success && result.data) {
      const { switch1State, switch2State, switch3State, switch4State, switch5State, reasoning } = result.data;
      const newSwitchStates = [switch1State, switch2State, switch3State, switch4State, switch5State];
      
      await updateAllSwitches(newSwitchStates);
      
      setAiReasoning(reasoning);
      toast({
        title: "Optimization Complete",
        description: "Switches have been adjusted intelligently.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Optimization Failed",
        description: result.error,
      });
    }
    setIsOptimizing(false);
  };

  const handleSwitchChange = async (id: number, checked: boolean) => {
    const targetSwitch = switches.find(s => s.id === id);
    if (!targetSwitch) return;

    // Optimistically update UI
    setSwitches(prev => prev.map(s => s.id === id ? { ...s, state: checked } : s));
    setAiReasoning('');

    const result = await updateSwitchState(id, targetSwitch.name, checked);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
      // Revert UI on failure (the listener will do this, but this is faster)
      setSwitches(prev => prev.map(s => s.id === id ? { ...s, state: !checked } : s));
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8 xl:col-span-9 space-y-6">
        <EnergyMetrics energyData={energyData} />
        <SwitchControl
          switches={switches}
          userPreferences={userPreferences}
          aiReasoning={aiReasoning}
          isOptimizing={isOptimizing}
          isPredictionAvailable={!!prediction}
          onSwitchChange={handleSwitchChange}
          onPreferencesChange={setUserPreferences}
          onOptimize={handleOptimization}
        />
      </div>

      <div className="lg:col-span-4 xl:col-span-3 space-y-6">
         <PredictionAnalytics
          prediction={prediction}
          isLoading={isPredictionLoading}
          onPredict={handlePrediction}
        />
        <UsageHistory />
      </div>
    </div>
  );
}
