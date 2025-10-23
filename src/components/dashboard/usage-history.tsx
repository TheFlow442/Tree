import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UsageChart } from './usage-chart';
import { HISTORICAL_DATA } from '@/lib/data';

export function UsageHistory() {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Energy Usage History</CardTitle>
        <CardDescription>Monthly energy consumption over the last year.</CardDescription>
      </CardHeader>
      <CardContent>
        <UsageChart data={HISTORICAL_DATA} />
      </CardContent>
    </Card>
  );
}
