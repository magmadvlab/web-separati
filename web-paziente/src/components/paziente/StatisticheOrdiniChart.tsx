"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { DashboardStats } from "@/types/api";
import { TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface StatisticheOrdiniChartProps {
  stats?: DashboardStats;
}

export function StatisticheOrdiniChart({ stats }: StatisticheOrdiniChartProps) {
  const ordiniPerMese = stats?.ordiniPerMese || [];

  if (ordiniPerMese.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ordini Ultimi 6 Mesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 text-center py-8">
            Nessun dato disponibile
          </p>
        </CardContent>
      </Card>
    );
  }

  // Trova il valore massimo per la scala
  const maxCount = Math.max(...ordiniPerMese.map((item) => item.count), 1);
  const maxTotale = Math.max(...ordiniPerMese.map((item) => item.totale), 1);

  // Formatta la data in formato più leggibile
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString("it-IT", { month: "short", year: "2-digit" });
  };

  const chartData = ordiniPerMese.map((item) => ({
    month: formatMonth(item.month),
    monthFull: item.month,
    ordini: item.count,
    spesa: item.totale,
  }));

  const chartConfig = {
    ordini: {
      label: "Ordini",
      color: "hsl(221.2, 83.2%, 53.3%)",
    },
    spesa: {
      label: "Spesa (€)",
      color: "hsl(212, 95%, 68%)",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Andamento Ordini (Ultimi 6 Mesi)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="ordini"
              fill="var(--color-ordini)"
              radius={[4, 4, 0, 0]}
              className="fill-primary"
            />
          </BarChart>
        </ChartContainer>
        <div className="flex items-center justify-between text-xs text-gray-600 pt-4 border-t mt-4">
          <div>
            <span className="font-medium">Totale ordini: </span>
            <span>{ordiniPerMese.reduce((sum, item) => sum + item.count, 0)}</span>
          </div>
          <div>
            <span className="font-medium">Totale spesa: </span>
            <span>€{ordiniPerMese.reduce((sum, item) => sum + item.totale, 0).toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

