"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { runEnergyPrediction, runIntelligentSwitchControl, updateSwitchState, getSwitchStates } from '@/app/actions';
import { INITIAL_ENERGY_DATA, INITIAL_SWITCHES } from '@/lib/data';
import type { EnergyData, SwitchState } from '@/lib/types';
import { EnergyMetrics } from './energy-metrics';
import { SwitchControl } from './switch-control';
import { UsageHistory } from './usage-history';
import { PredictionAnalytics } from './prediction-analytics';
import type { PredictEnergyConsumptionOutput } from '@/ai/flows/predict-energy-consumption';
import { useDatabase, useMemoFirebase } from '@/firebase';
import { onValue, ref } from 'firebase/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BeakerIcon } from 'lucide-react';

export function Dashboard() {
  const [energyData, setEnergyData] = useState<EnergyData>(INITIAL_ENERGY_DATA);
  const [switches, setSwitches] = useState<SwitchState[]>(INITIAL_SWITCHES);
  const [userPreferences, setUserPreferences] = useState('Prioritize extending battery life and reducing cost. Only turn on essential appliances if battery is below 40%.');
  const [prediction, setPrediction] = useState<PredictEnergyConsumptionOutput | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const [manualBatteryInput, setManualBatteryInput] = useState('');
  const { toast } = useToast();
  const database = useDatabase();

  // Ref to prevent multiple optimizations for the same low-battery event
  const lowBatteryOptimizationTriggered = useRef(false);

  const handlePrediction = useCallback(async () => {
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
  }, [toast]);

  const updateAllSwitches = useCallback(async (newSwitchStates: boolean[]) => {
    const updatedSwitches = switches.map((s, i) => ({
      ...s,
      state: newSwitchStates[i],
    }));

    // Optimistically update UI
    setSwitches(updatedSwitches);

    // Call server action for each switch
    for (const s of updatedSwitches) {
      // no need to await, fire and forget
      updateSwitchState(s.id, s.name, s.state);
    }
  }, [switches]);

  const handleOptimization = useCallback(async (isAutomatic: boolean = false) => {
    if (!prediction) {
      // Run prediction if it's not available yet
      await handlePrediction();
    }
    // Use a function to get the latest prediction state
    setPrediction(latestPrediction => {
      if (!latestPrediction) {
        toast({
          variant: "destructive",
          title: "Cannot Optimize",
          description: "Prediction data is not available. Please try again.",
        });
        return latestPrediction;
      }
      
      setIsOptimizing(true);
      runIntelligentSwitchControl({
        ...energyData,
        powerConsumption: energyData.power,
        predictedUsage: latestPrediction.predictedConsumption,
        userPreferences,
        userUsagePatterns: latestPrediction.userUsagePatterns,
      }).then(result => {
        if (result.success && result.data) {
          const { switch1State, switch2State, switch3State, switch4State, switch5State, reasoning } = result.data;
          const newSwitchStates = [switch1State, switch2State, switch3State, switch4State, switch5State];
          
          updateAllSwitches(newSwitchStates);
          
          setAiReasoning(reasoning);
          toast({
            title: isAutomatic ? "Low Battery Action" : "Optimization Complete",
            description: isAutomatic ? "AI has adjusted switches to conserve power." : "Switches have been adjusted intelligently.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Optimization Failed",
            description: result.error,
          });
        }
        setIsOptimizing(false);
      });
      
      return latestPrediction;
    });

  }, [prediction, energyData, userPreferences, handlePrediction, toast, updateAllSwitches]);

  const setBatteryLevel = (level: number) => {
     setEnergyData(prev => {
        const newBatteryLevel = level;
        const newEnergyData = { ...prev, batteryLevel: newBatteryLevel };

        // Automatic low-battery optimization logic
        if (newBatteryLevel < 40 && !lowBatteryOptimizationTriggered.current) {
            lowBatteryOptimizationTriggered.current = true; // Set flag to prevent re-triggering
            handleOptimization(true); // isAutomatic = true
        } else if (newBatteryLevel >= 40) {
            lowBatteryOptimizationTriggered.current = false; // Reset flag when battery is healthy
        }
        
        return newEnergyData;
     });
  }

  const handleManualBatteryUpdate = () => {
    const newLevel = parseFloat(manualBatteryInput);
    if (!isNaN(newLevel) && newLevel >= 0 && newLevel <= 100) {
      setBatteryLevel(newLevel);
      toast({
        title: "Battery Level Simulated",
        description: `Battery level manually set to ${newLevel}%.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please enter a number between 0 and 100.",
      });
    }
  }


  useEffect(() => {
    handlePrediction(); // Initial prediction on load

    const initialFetch = async () => {
      const result = await getSwitchStates();
      if (result.success && result.data) {
        const dbSwitches = Object.entries(result.data).map(([id, s]: [string, any]) => ({
          id: parseInt(id, 10),
          name: s.name,
          state: s.state,
        }));
        // sync with initial switches
        const syncedSwitches = INITIAL_SWITCHES.map(is => {
            const dbSwitch = dbSwitches.find(dbs => dbs.id === is.id);
            return dbSwitch ? dbSwitch : is;
        });

        setSwitches(syncedSwitches);
      }
    };
    initialFetch();

  }, [handlePrediction]);

  const energyDataRef = useMemoFirebase(() => database ? ref(database, 'app/energyData') : null, [database]);
  const switchStatesRef = useMemoFirebase(() => database ? ref(database, 'app/switchStates') : null, [database]);

  useEffect(() => {
    if (!energyDataRef) return;
    const unsubscribe = onValue(energyDataRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Get the latest entry
        const latestKey = Object.keys(data).sort().pop();
        if (latestKey) {
            const latestData = data[latestKey];
             setEnergyData(prev => {
                const newBatteryLevel = latestData.batteryLevel ?? prev.batteryLevel;
                const newEnergyData = {
                    ...prev, // keep fields not sent by device
                    voltage: latestData.voltage ?? prev.voltage,
                    current: latestData.current ?? prev.current,
                    batteryLevel: newBatteryLevel,
                    power: (latestData.voltage && latestData.current) ? latestData.voltage * latestData.current : prev.power,
                    temperature: latestData.temperature ?? prev.temperature,
                    humidity: latestData.humidity ?? prev.humidity,
                };

                // Automatic low-battery optimization logic
                if (newBatteryLevel < 40 && !lowBatteryOptimizationTriggered.current) {
                    lowBatteryOptimizationTriggered.current = true; // Set flag to prevent re-triggering
                    handleOptimization(true); // isAutomatic = true
                } else if (newBatteryLevel >= 40) {
                    lowBatteryOptimizationTriggered.current = false; // Reset flag when battery is healthy
                }
                
                return newEnergyData;
             });
        }
      }
    });
    return () => unsubscribe();
  }, [energyDataRef, handleOptimization]);

   useEffect(() => {
    if (!switchStatesRef) return;
    const unsubscribe = onValue(switchStatesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSwitches(prevSwitches => {
          const updatedSwitches = [...prevSwitches];
          let hasChanged = false;
          Object.entries(data).forEach(([id, s]: [string, any]) => {
            const switchId = parseInt(id, 10);
            const switchIndex = updatedSwitches.findIndex(sw => sw.id === switchId);
            if (switchIndex !== -1 && updatedSwitches[switchIndex].state !== s.state) {
              updatedSwitches[switchIndex] = { ...updatedSwitches[switchIndex], name: s.name, state: s.state };
              hasChanged = true;
            }
          });
          return hasChanged ? updatedSwitches : prevSwitches;
        });
      }
    });
    return () => unsubscribe();
  }, [switchStatesRef]);

  const handleSwitchChange = async (id: number, checked: boolean) => {
    const targetSwitch = switches.find(s => s.id === id);
    if (!targetSwitch) return;

    // Optimistic UI update
    setSwitches(prev => prev.map(s => s.id === id ? { ...s, state: checked } : s));
    setAiReasoning('');

    const result = await updateSwitchState(id, targetSwitch.name, checked);
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.error,
      });
      // Revert UI on failure
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
          onOptimize={() => handleOptimization(false)}
        />
      </div>

      <div className="lg:col-span-4 xl:col-span-3 space-y-6">
         <PredictionAnalytics
          prediction={prediction}
          isLoading={isPredictionLoading}
          onPredict={handlePrediction}
        />
        <Card className="shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BeakerIcon className="text-primary w-6 h-6" />
              <CardTitle className="font-headline text-xl">Testing</CardTitle>
            </div>
            <CardDescription>Manually set battery % to test AI logic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="manual-battery">Simulate Battery Level (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="manual-battery"
                  type="number"
                  placeholder="e.g., 30"
                  value={manualBatteryInput}
                  onChange={(e) => setManualBatteryInput(e.target.value)}
                />
                <Button onClick={handleManualBatteryUpdate}>Set</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <UsageHistory />
      </div>
    </div>
  );
}
