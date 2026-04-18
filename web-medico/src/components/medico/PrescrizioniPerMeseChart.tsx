"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

interface PrescrizioniPerMeseChartProps {
  prescrizioni: any[];
}

export function PrescrizioniPerMeseChart({ prescrizioni }: PrescrizioniPerMeseChartProps) {
  // Calcola prescrizioni per mese (ultimi 6 mesi)
  const now = new Date();
  const mesi: Array<{ month: string; monthFull: string; count: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const data = new Date(now.getFullYear(), now.getMonth() - i, 1);
    mesi.push({
      month: data.toLocaleDateString("it-IT", { month: "short", year: "2-digit" }),
      monthFull: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`,
      count: 0,
    });
  }

  // Conta prescrizioni per mese
  prescrizioni?.forEach((prescrizione) => {
    const dataEmissione = new Date(prescrizione.dataEmissione);
    const monthKey = `${dataEmissione.getFullYear()}-${String(dataEmissione.getMonth() + 1).padStart(2, "0")}`;
    const mese = mesi.find((m) => m.monthFull === monthKey);
    if (mese) {
      mese.count++;
    }
  });

  const chartConfig = {
    prescrizioni: {
      label: "Prescrizioni",
      color: "hsl(142.1, 76.2%, 36.3%)",
    },
  };

  if (prescrizioni.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Prescrizioni Ultimi 6 Mesi
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Andamento Prescrizioni (Ultimi 6 Mesi)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <AreaChart data={mesi}>
            <defs>
              <linearGradient id="fillPrescrizioni" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142.1, 76.2%, 36.3%)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(142.1, 76.2%, 36.3%)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(142.1, 76.2%, 36.3%)"
              fill="url(#fillPrescrizioni)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
        <div className="flex items-center justify-between text-xs text-gray-600 pt-4 border-t mt-4">
          <div>
            <span className="font-medium">Totale prescrizioni: </span>
            <span>{mesi.reduce((sum, item) => sum + item.count, 0)}</span>
          </div>
          <div>
            <span className="font-medium">Media mensile: </span>
            <span>{(mesi.reduce((sum, item) => sum + item.count, 0) / mesi.length).toFixed(1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}













