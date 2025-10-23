import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Battery, Zap, Gauge, Power } from 'lucide-react';

interface EnergyMetricProps {
  label: 'Voltage' | 'Current' | 'Power' | 'Battery';
  value: string;
  batteryLevel?: number;
}

const getBatteryColor = (level: number) => {
  if (level > 50) return 'text-primary';
  if (level > 20) return 'text-accent-foreground';
  return 'text-destructive';
};

export function EnergyMetric({ label, value, batteryLevel }: EnergyMetricProps) {
  const Icon = () => {
    switch(label) {
      case 'Voltage': return <Gauge className="h-6 w-6 text-muted-foreground" />;
      case 'Current': return <Zap className="h-6 w-6 text-muted-foreground" />;
      case 'Power': return <Power className="h-6 w-6 text-muted-foreground" />;
      case 'Battery': return <Battery className={cn("h-6 w-6", batteryLevel !== undefined ? getBatteryColor(batteryLevel) : 'text-muted-foreground')} />;
      default: return null;
    }
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon />
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-2xl font-bold",
          label === 'Battery' && batteryLevel !== undefined && getBatteryColor(batteryLevel)
        )}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
