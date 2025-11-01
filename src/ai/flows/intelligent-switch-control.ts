
'use server';

/**
 * @fileOverview An AI agent for intelligently managing five switches based on real-time parameters, predicted energy consumption, and user preferences, utilizing a deployed Firebase ML model.
 *
 * - intelligentSwitchControl - A function that handles the intelligent switch control process.
 * - IntelligentSwitchControlInput - The input type for the intelligentSwitchControl function.
 * - IntelligentSwitchControlOutput - The return type for the intelligentSwitchControl function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentSwitchControlInputSchema = z.object({
  voltage: z.number().describe('The current voltage of the solar system.'),
  current: z.number().describe('The current current of the solar system.'),
  batteryLevel: z.number().describe('The current battery level of the solar system (0-100).'),
  powerConsumption: z.number().describe("The current power consumption in Watts."),
  predictedUsage: z.number().describe('The predicted energy consumption for the next period from the Firebase ML model.'),
  userPreferences: z.string().describe('The user preferences for energy usage and switch control.'),
  userUsagePatterns: z.string().describe('Analysis of historical user usage patterns from the Firebase ML model.')
});
export type IntelligentSwitchControlInput = z.infer<typeof IntelligentSwitchControlInputSchema>;

const IntelligentSwitchControlOutputSchema = z.object({
  switch1State: z.boolean().describe('The recommended state of switch 1 (true for on, false for off).'),
  switch2State: z.boolean().describe('The recommended state of switch 2 (true for on, false for off).'),
  switch3State: z.boolean().describe('The recommended state of switch 3 (true for on, false for off).'),
  switch4State: z.boolean().describe('The recommended state of switch 4 (true for on, false for off).'),
  switch5State: z.boolean().describe('The recommended state of switch 5 (true for on, false for off).'),
  reasoning: z.string().describe('The reasoning behind the switch state recommendations.'),
});
export type IntelligentSwitchControlOutput = z.infer<typeof IntelligentSwitchControlOutputSchema>;

export async function intelligentSwitchControl(input: IntelligentSwitchControlInput): Promise<IntelligentSwitchControlOutput> {
  return intelligentSwitchControlFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentSwitchControlPrompt',
  input: {schema: IntelligentSwitchControlInputSchema},
  output: {schema: IntelligentSwitchControlOutputSchema},
  prompt: `You are an AI assistant acting as a Proximal Policy Optimization (PPO) reinforcement learning model, designed to intelligently manage five switches in a smart solar system. Your primary goal is to optimize energy usage, protect battery health, and adhere to user preferences by following a strict set of rules.

  Current System State:
  - Voltage: {{{voltage}}}V
  - Current: {{{current}}}A
  - Battery Level: {{{batteryLevel}}}%
  - Current Power Consumption: {{{powerConsumption}}}W
  - ML-Predicted Energy Usage: {{{predictedUsage}}} units
  - ML-Derived User Usage Patterns: "{{{userUsagePatterns}}}"
  - User Preferences: "{{{userPreferences}}}"

  **Your Task:**
  Based on the state above, determine the optimal state for each of the five switches by following these rules in order of priority.

  **Critical Rules Hierarchy:**
  1.  **CRITICAL (Below 10%):** If the battery level is below 10%, you MUST turn off ALL switches to protect the battery. This overrides all other rules and user preferences.
  2.  **VERY LOW (10% - 20%):** If the battery level is between 10% and 20%, you MUST turn on only ONE essential switch. Identify the most critical switch based on user patterns and preferences.
  3.  **LOW (30% - 50%):** If the battery level is between 30% and 50%, you MUST turn on a maximum of TWO switches. Prioritize essential switches based on user patterns and preferences.
  4.  **HEALTHY (60% - 70%):** If the battery level is between 60% and 70%, you can turn on all switches, but you should still optimize their states based on user preferences and usage patterns to save energy.
  5.  **GENERAL (Below 40%):** As a general guideline, if the battery level is below 40%, you should be conservative and turn off non-essential switches. This rule helps inform decisions in the 30-50% range.
  6.  **User-Centric Logic:** For all other battery levels, your decisions should be guided by the user's historical usage patterns and their stated preferences.
  7.  **Clear Reasoning:** Provide a clear, concise reasoning for your recommendations. The reasoning must explicitly state which battery rule influenced your decision.

  Output the recommended state for each switch (true for on, false for off) and your reasoning in the JSON format specified by the output schema.
  `,
});

const intelligentSwitchControlFlow = ai.defineFlow(
  {
    name: 'intelligentSwitchControlFlow',
    inputSchema: IntelligentSwitchControlInputSchema,
    outputSchema: IntelligentSwitchControlOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
