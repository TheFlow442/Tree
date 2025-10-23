'use server';

/**
 * @fileOverview Predicts future energy consumption based on historical data using a Firebase ML model.
 *
 * - predictEnergyConsumption - A function that handles the energy consumption prediction process.
 * - PredictEnergyConsumptionInput - The input type for the predictEnergyConsumption function.
 * - PredictEnergyConsumptionOutput - The return type for the predictEnergyConsumption function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictEnergyConsumptionInputSchema = z.object({
  historicalData: z.string().describe('Historical energy consumption data in JSON format.'),
  modelName: z.string().describe('The name of the deployed Firebase ML model.'),
});

export type PredictEnergyConsumptionInput = z.infer<typeof PredictEnergyConsumptionInputSchema>;

const PredictEnergyConsumptionOutputSchema = z.object({
  predictedConsumption: z.number().describe('The predicted future energy consumption.'),
  confidenceInterval: z.number().describe('The confidence interval for the prediction.'),
  analysis: z.string().describe('An analysis of the factors influencing the prediction.'),
});

export type PredictEnergyConsumptionOutput = z.infer<typeof PredictEnergyConsumptionOutputSchema>;

export async function predictEnergyConsumption(input: PredictEnergyConsumptionInput): Promise<PredictEnergyConsumptionOutput> {
  return predictEnergyConsumptionFlow(input);
}

const predictEnergyConsumptionPrompt = ai.definePrompt({
  name: 'predictEnergyConsumptionPrompt',
  input: {schema: PredictEnergyConsumptionInputSchema},
  output: {schema: PredictEnergyConsumptionOutputSchema},
  prompt: `You are an expert energy consumption prediction system.

  Analyze the historical energy consumption data and predict future energy consumption.
  Also, provide a confidence interval for the prediction and an analysis of the factors influencing the prediction.

  Historical Data: {{{historicalData}}}
  Model Name: {{{modelName}}}
  \n  Ensure the output is a JSON object that conforms to the PredictEnergyConsumptionOutputSchema. Include the predictedConsumption, confidenceInterval, and analysis.
  `,
});

const predictEnergyConsumptionFlow = ai.defineFlow(
  {
    name: 'predictEnergyConsumptionFlow',
    inputSchema: PredictEnergyConsumptionInputSchema,
    outputSchema: PredictEnergyConsumptionOutputSchema,
  },
  async input => {
    const {output} = await predictEnergyConsumptionPrompt(input);
    return output!;
  }
);
