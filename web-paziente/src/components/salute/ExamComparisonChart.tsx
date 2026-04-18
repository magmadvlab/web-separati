"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import api from "@/lib/api";

interface ExamComparisonChartProps {
  esame1Id: number;
  esame2Id: number;
}

export function ExamComparisonChart({ esame1Id, esame2Id }: ExamComparisonChartProps) {
  const { data: comparison, isLoading } = useQuery({
    queryKey: ['exam-comparison', esame1Id, esame2Id],
    queryFn: async () => {
      const response = await api.get(`/salute/esami/confronto?esame1Id=${esame1Id}&esame2Id=${esame2Id}`);
      return response.data.data || response.data;
    },
  });

  const { data: chartData } = useQuery({
    queryKey: ['exam-comparison-chart', esame1Id, esame2Id],
    queryFn: async () => {
      const response = await api.get(`/salute/esami/confronto/grafico?esame1Id=${esame1Id}&esame2Id=${esame2Id}`);
      return response.data.data || response.data;
    },
  });

  if (isLoading) {
    return <Card><CardContent className="p-6">Caricamento confronto...</CardContent></Card>;
  }

  if (!comparison || !chartData) {
    return null;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const chartDataFormatted = comparison.parametri.map((p: any, idx: number) => ({
    parametro: p.parametro,
    [`Esame ${formatDate(comparison.esame1.data)}`]: p.valore1,
    [`Esame ${formatDate(comparison.esame2.data)}`]: p.valore2,
    rangeMin: p.range.minimo || 0,
    rangeMax: p.range.massimo || 0,
    trend: p.trend,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Confronto Esami</span>
          <Badge variant="outline">
            {comparison.giorniDifferenza} giorni di differenza
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            esame1: { label: `Esame ${formatDate(comparison.esame1.data)}`, color: "hsl(221.2, 83.2%, 53.3%)" },
            esame2: { label: `Esame ${formatDate(comparison.esame2.data)}`, color: "hsl(142.1, 76.2%, 36.3%)" },
          }}
          className="h-[400px]"
        >
          <BarChart data={chartDataFormatted}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="parametro"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar
              dataKey={`Esame ${formatDate(comparison.esame1.data)}`}
              fill="hsl(221.2, 83.2%, 53.3%)"
            />
            <Bar
              dataKey={`Esame ${formatDate(comparison.esame2.data)}`}
              fill="hsl(142.1, 76.2%, 36.3%)"
            />
            <ReferenceLine
              y={chartDataFormatted[0]?.rangeMin}
              stroke="red"
              strokeDasharray="5 5"
              label="Range Min"
            />
            <ReferenceLine
              y={chartDataFormatted[0]?.rangeMax}
              stroke="red"
              strokeDasharray="5 5"
              label="Range Max"
            />
          </BarChart>
        </ChartContainer>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Dettaglio Parametri</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Parametro</th>
                  <th className="text-right p-2">{formatDate(comparison.esame1.data)}</th>
                  <th className="text-right p-2">{formatDate(comparison.esame2.data)}</th>
                  <th className="text-right p-2">Variazione</th>
                  <th className="text-center p-2">Trend</th>
                  <th className="text-center p-2">Stato</th>
                </tr>
              </thead>
              <tbody>
                {comparison.parametri.map((p: any, idx: number) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{p.parametro}</td>
                    <td className="text-right p-2">
                      {p.valore1.toFixed(2)} {p.unitaMisura}
                    </td>
                    <td className="text-right p-2">
                      {p.valore2.toFixed(2)} {p.unitaMisura}
                    </td>
                    <td className="text-right p-2">
                      <span className={p.variazionePercentuale > 0 ? 'text-red-600' : 'text-green-600'}>
                        {p.variazionePercentuale > 0 ? '+' : ''}{p.variazionePercentuale.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center p-2">
                      {p.trend === 'miglioramento' && <TrendingDown className="w-4 h-4 text-green-600 inline" />}
                      {p.trend === 'peggioramento' && <TrendingUp className="w-4 h-4 text-red-600 inline" />}
                      {p.trend === 'stabile' && <Minus className="w-4 h-4 text-gray-600 inline" />}
                    </td>
                    <td className="text-center p-2">
                      {p.anomalia && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Anomalia
                        </Badge>
                      )}
                      {!p.anomalia && p.stato2 === 'normale' && (
                        <Badge variant="outline" className="text-xs">Normale</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




