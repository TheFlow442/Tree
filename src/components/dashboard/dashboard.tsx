"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { runEnergyPrediction, runIntelligentSwitchControl } from '@/app/actions';
import { INITIAL_ENERGY_DATA, INITIAL_SWITCHES } from '@/lib/data';
import type { EnergyData, SwitchState, Prediction } from '@/lib/types';
import { EnergyMetrics } from './energy-metrics';
import { SwitchControl } from './switch-control';
import { UsageHistory } from './usage-history';
import { PredictionAnalytics } from './prediction-analytics';

export function Dashboard() {
  const [energyData, setEnergyData] = useState<EnergyData>(INITIAL_ENERGY_DATA);
  const [switches, setSwitches] = useState<SwitchState[]>(INITIAL_SWITCHES);
  const [userPreferences, setUserPreferences] = useState('Prioritize extending battery life and reducing cost. Only turn on essential appliances if battery is below 40%.');
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergyData(prevData => {
        const newVoltage = parseFloat((prevData.voltage + (Math.random() - 0.5) * 2).toFixed(1));
        const newCurrent = parseFloat((prevData.current + (Math.random() - 0.5) * 0.5).toFixed(1));
        return {
          voltage: newVoltage,
          current: newCurrent,
          batteryLevel: Math.max(0, Math.min(100, Math.round(prevData.batteryLevel + (Math.random() - 0.51) * 2))),
          power: parseFloat((newVoltage * newCurrent).toFixed(1)),
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
        title: "Prediction Successful",
        description: "Future energy consumption has been predicted.",
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
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-4">
      <div className="lg:col-span-2 xl:col-span-3 space-y-6">
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

      <div className="lg:col-span-1 xl:col-span-1 space-y-6">
        <UsageHistory />
        <PredictionAnalytics
          prediction={prediction}
          isLoading={isPredictionLoading}
          onPredict={handlePrediction}
        />
      </div>
    </div>
  );
}
