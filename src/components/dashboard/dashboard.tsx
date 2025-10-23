"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { runEnergyPrediction, runIntelligentSwitchControl } from '@/app/actions';
import { INITIAL_ENERGY_DATA, INITIAL_SWITCHES } from '@/lib/data';
import type { EnergyData, SwitchState } from '@/lib/types';
import { EnergyMetrics } from './energy-metrics';
import { SwitchControl } from './switch-control';
import { UsageHistory } from './usage-history';
import { PredictionAnalytics } from './prediction-analytics';
import type { PredictEnergyConsumptionOutput } from '@/ai/flows/predict-energy-consumption';

export function Dashboard() {
  const [energyData, setEnergyData] = useState<EnergyData>(INITIAL_ENERGY_DATA);
  const [switches, setSwitches] = useState<SwitchState[]>(INITIAL_SWITCHES);
  const [userPreferences, setUserPreferences] = useState('Prioritize extending battery life and reducing cost. Only turn on essential appliances if battery is below 40%.');
  const [prediction, setPrediction] = useState<PredictEnergyConsumptionOutput | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    handlePrediction(); // Initial prediction on load
    const interval = setInterval(() => {
      setEnergyData(prevData => {
        const newVoltage = parseFloat((prevData.voltage + (Math.random() - 0.5) * 2).toFixed(1));
        const newCurrent = parseFloat((prevData.current + (Math.random() - 0.5) * 0.5).toFixed(1));
        return {
          voltage: newVoltage,
          current: newCurrent,
          batteryLevel: Math.max(0, Math.min(100, Math.round(prevData.batteryLevel - Math.random() * 0.5))),
          power: parseFloat((newVoltage * newCurrent).toFixed(1)),
          temperature: parseFloat((prevData.temperature + (Math.random() - 0.5) * 0.5).toFixed(1)),
          humidity: Math.max(0, Math.min(100, Math.round(prevData.humidity + (Math.random() - 0.5) * 1))),
          totalConsumption: parseFloat((prevData.totalConsumption + Math.random() * 0.1).toFixed(2)),
          energyRemain: parseFloat((prevData.energyRemain - Math.random() * 0.05).toFixed(2)),
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
      setSwitches(prevSwitches =>
        prevSwitches.map((s, i) => ({ ...s, state: newSwitchStates[i] }))
      );
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

  const handleSwitchChange = (id: number, checked: boolean) => {
    setSwitches(prev => prev.map(s => s.id === id ? { ...s, state: checked } : s));
    setAiReasoning('');
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
