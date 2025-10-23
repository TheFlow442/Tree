import { Lightbulb, Thermometer, Droplets, Utensils, TreePine, BrainCircuit, Loader2 } from 'lucide-react';
import type { SwitchState } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const switchIcons: { [key: string]: React.ReactNode } = {
  "Living Room Lights": <Lightbulb className="h-5 w-5" />,
  "Air Conditioner": <Thermometer className="h-5 w-5" />,
  "Water Heater": <Droplets className="h-5 w-5" />,
  "Kitchen Appliances": <Utensils className="h-5 w-5" />,
  "Outdoor Lighting": <TreePine className="h-5 w-5" />,
};

type SwitchControlProps = {
  switches: SwitchState[];
  userPreferences: string;
  aiReasoning: string;
  isOptimizing: boolean;
  isPredictionAvailable: boolean;
  onSwitchChange: (id: number, checked: boolean) => void;
  onPreferencesChange: (value: string) => void;
  onOptimize: () => void;
};

export function SwitchControl({
  switches,
  userPreferences,
  aiReasoning,
  isOptimizing,
  isPredictionAvailable,
  onSwitchChange,
  onPreferencesChange,
  onOptimize
}: SwitchControlProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Smart Switch Control</CardTitle>
        <CardDescription>Manage your devices manually or use AI for optimal energy use.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {switches.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="text-primary">{switchIcons[s.name]}</div>
                <label htmlFor={`switch-${s.id}`} className="text-sm font-medium">{s.name}</label>
              </div>
              <Switch
                id={`switch-${s.id}`}
                checked={s.state}
                onCheckedChange={(checked) => onSwitchChange(s.id, checked)}
                aria-label={s.name}
              />
            </div>
          ))}
        </div>

        {aiReasoning && (
          <div className="p-4 border-l-4 border-primary bg-primary/10 rounded-r-lg animate-in fade-in-0">
            <div className="flex">
              <BrainCircuit className="h-5 w-5 mr-3 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-primary">AI Recommendation</p>
                <p className="text-sm text-foreground/80 mt-1">{aiReasoning}</p>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <label htmlFor="preferences" className="text-sm font-medium">User Preferences</label>
          <Textarea
            id="preferences"
            value={userPreferences}
            onChange={e => onPreferencesChange(e.target.value)}
            placeholder="e.g., Prioritize battery life, turn off non-essentials at night..."
            className="mt-2"
          />
        </div>
        <Button onClick={onOptimize} disabled={isOptimizing || !isPredictionAvailable}>
          {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
          {isOptimizing ? 'Optimizing...' : 'Optimize with AI'}
        </Button>
      </CardContent>
    </Card>
  );
}
