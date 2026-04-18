"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

interface OrdiniCompletatiSettimanaChartProps {
  ordini: any[];
}

export function OrdiniCompletatiSettimanaChart({ ordini }: OrdiniCompletatiSettimanaChartProps) {
  // Calcola ordini completati per giorno (ultimi 7 giorni)
  const now = new Date();
  const giorni: Array<{ giorno: string; giornoFull: string; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const data = new Date(now);
    data.setDate(data.getDate() - i);
    giorni.push({
      giorno: data.toLocaleDateString("it-IT", { weekday: "short", day: "numeric" }),
      giornoFull: data.toISOString().split("T")[0],
      count: 0,
    });
  }

  // Conta solo ordini completati per giorno
  ordini?.forEach((ordine) => {
    if (ordine.stato === "consegnato" && ordine.dataConsegna) {
      const dataConsegna = new Date(ordine.dataConsegna);
      const giornoKey = dataConsegna.toISOString().split("T")[0];
      const giorno = giorni.find((g) => g.giornoFull === giornoKey);
      if (giorno) {
        giorno.count++;
      }
    }
  });

  const chartConfig = {
    completati: {
      label: "Ordini Completati",
      color: "hsl(142.1, 76.2%, 36.3%)",
    },
  };

  const totaleCompletati = giorni.reduce((sum, item) => sum + item.count, 0);

  if (totaleCompletati === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ordini Completati (Ultimi 7 Giorni)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 text-center py-8">
            Nessun ordine completato negli ultimi 7 giorni
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Performance Settimanale (Ultimi 7 Giorni)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <AreaChart data={giorni}>
            <defs>
              <linearGradient id="fillCompletati" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142.1, 76.2%, 36.3%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(142.1, 76.2%, 36.3%)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="giorno"
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
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(142.1, 76.2%, 36.3%)"
              fill="url(#fillCompletati)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        <div className="flex items-center justify-between text-xs text-gray-600 pt-4 border-t mt-4">
          <div>
            <span className="font-medium">Totale completati: </span>
            <span>{totaleCompletati}</span>
          </div>
          <div>
            <span className="font-medium">Media giornaliera: </span>
            <span>{(totaleCompletati / giorni.length).toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}













