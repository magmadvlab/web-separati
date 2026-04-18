"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Truck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

interface PerformanceSettimanaleChartProps {
  ordini: any[];
}

const ASSIGNED_ORDER_STATUSES = new Set(["assegnato", "assegnato_rider"]);

export function PerformanceSettimanaleChart({ ordini }: PerformanceSettimanaleChartProps) {
  // Calcola performance per settimana (ultime 4 settimane)
  const now = new Date();
  const settimane: Array<{ settimana: string; label: string; completati: number; inConsegna: number; assegnati: number }> = [];
  
  for (let i = 3; i >= 0; i--) {
    const dataInizio = new Date(now);
    dataInizio.setDate(dataInizio.getDate() - (i * 7 + 6));
    const dataFine = new Date(dataInizio);
    dataFine.setDate(dataFine.getDate() + 6);
    
    settimane.push({
      settimana: `Sett ${4 - i}`,
      label: `${dataInizio.getDate()}/${dataInizio.getMonth() + 1} - ${dataFine.getDate()}/${dataFine.getMonth() + 1}`,
      completati: 0,
      inConsegna: 0,
      assegnati: 0,
    });
  }

  // Conta ordini per settimana
  ordini?.forEach((ordine) => {
    const dataCreazione = new Date(ordine.dataCreazione);
    const settimanaIndex = settimane.findIndex((s, idx) => {
      const dataInizio = new Date(now);
      dataInizio.setDate(dataInizio.getDate() - ((3 - idx) * 7 + 6));
      const dataFine = new Date(dataInizio);
      dataFine.setDate(dataFine.getDate() + 6);
      return dataCreazione >= dataInizio && dataCreazione <= dataFine;
    });

    if (settimanaIndex !== -1) {
      if (ordine.stato === "consegnato") {
        settimane[settimanaIndex].completati++;
      } else if (ordine.stato === "in_consegna") {
        settimane[settimanaIndex].inConsegna++;
      } else if (ASSIGNED_ORDER_STATUSES.has(ordine.stato)) {
        settimane[settimanaIndex].assegnati++;
      }
    }
  });

  const chartConfig = {
    completati: {
      label: "Completati",
      color: "hsl(142.1, 76.2%, 36.3%)",
    },
    inConsegna: {
      label: "In Consegna",
      color: "hsl(24.6, 95%, 53.1%)",
    },
    assegnati: {
      label: "Assegnati",
      color: "hsl(221.2, 83.2%, 53.3%)",
    },
  };

  const totaleCompletati = settimane.reduce((sum, s) => sum + s.completati, 0);

  if (ordini.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Performance Settimanale
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
          <Truck className="h-4 w-4" />
          Performance Ultime 4 Settimane
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <BarChart data={settimane}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="settimana"
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
            <Bar dataKey="completati" stackId="a" radius={[0, 0, 0, 0]}>
              {settimane.map((entry, index) => (
                <Cell key={`cell-completati-${index}`} fill="hsl(142.1, 76.2%, 36.3%)" />
              ))}
            </Bar>
            <Bar dataKey="inConsegna" stackId="a" radius={[0, 0, 0, 0]}>
              {settimane.map((entry, index) => (
                <Cell key={`cell-inConsegna-${index}`} fill="hsl(24.6, 95%, 53.1%)" />
              ))}
            </Bar>
            <Bar dataKey="assegnati" stackId="a" radius={[4, 4, 0, 0]}>
              {settimane.map((entry, index) => (
                <Cell key={`cell-assegnati-${index}`} fill="hsl(221.2, 83.2%, 53.3%)" />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totaleCompletati}</div>
            <div className="text-xs text-gray-600">Totale Completati</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {settimane.reduce((sum, s) => sum + s.inConsegna, 0)}
            </div>
            <div className="text-xs text-gray-600">In Consegna</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {settimane.reduce((sum, s) => sum + s.assegnati, 0)}
            </div>
            <div className="text-xs text-gray-600">Assegnati</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}












