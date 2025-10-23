import type { Prediction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';

type PredictionAnalyticsProps = {
  prediction: Prediction | null;
  isLoading: boolean;
  onPredict: () => void;
};

export function PredictionAnalytics({ prediction, isLoading, onPredict }: PredictionAnalyticsProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Predictive Analytics</CardTitle>
        <CardDescription>Forecast future consumption to make smarter decisions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {prediction ? (
          <div className="space-y-4 text-sm animate-in fade-in-0">
            <div>
              <p className="font-semibold text-muted-foreground">Predicted Consumption</p>
              <p className="text-2xl font-bold text-primary">{prediction.predictedConsumption.toFixed(2)} kWh</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Confidence Interval</p>
              <p className="text-foreground/80">&plusmn;{prediction.confidenceInterval.toFixed(2)} kWh</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">AI Analysis</p>
              <p className="text-foreground/80 italic">"{prediction.analysis}"</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>Click the button to generate an energy prediction.</p>
          </div>
        )}
        <Button onClick={onPredict} disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
          {isLoading ? 'Predicting...' : 'Predict Consumption'}
        </Button>
      </CardContent>
    </Card>
  );
}
