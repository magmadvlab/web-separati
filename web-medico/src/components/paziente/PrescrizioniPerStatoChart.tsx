"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { FileText } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";

interface PrescrizioniPerStatoChartProps {
  prescrizioni: any[];
}

const COLORS = {
  attiva: "hsl(142.1, 76.2%, 36.3%)",
  ricevuta: "hsl(221.2, 83.2%, 53.3%)",
  scaduta: "hsl(0, 84.2%, 60.2%)",
  utilizzata: "hsl(0, 0%, 45.1%)",
};

const STATO_LABELS: Record<string, string> = {
  attiva: "Attive",
  ricevuta: "Ricevute",
  scaduta: "Scadute",
  utilizzata: "Utilizzate",
};

export function PrescrizioniPerStatoChart({ prescrizioni }: PrescrizioniPerStatoChartProps) {
  // Calcola prescrizioni per stato
  const statoCounts: Record<string, number> = {};
  
  prescrizioni?.forEach((prescrizione) => {
    const stato = prescrizione.stato || "sconosciuto";
    statoCounts[stato] = (statoCounts[stato] || 0) + 1;
  });

  const chartData = Object.entries(statoCounts).map(([stato, count]) => ({
    stato,
    label: STATO_LABELS[stato] || stato,
    value: count,
    color: COLORS[stato as keyof typeof COLORS] || "hsl(0, 0%, 45.1%)",
  }));

  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.stato] = {
      label: item.label,
      color: item.color,
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  if (prescrizioni.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Prescrizioni per Stato
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
          <FileText className="h-4 w-4" />
          Distribuzione Prescrizioni per Stato
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ label, value }) => `${label}: ${value}`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t mt-4">
          {chartData.map((item) => (
            <div key={item.stato} className="text-center">
              <div className="text-2xl font-bold" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-xs text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}













