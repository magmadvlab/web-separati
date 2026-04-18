"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import api from "@/lib/api";

interface ParameterTrendChartProps {
  parametro: string;
  periodo?: number;
}

export function ParameterTrendChart({ parametro, periodo = 12 }: ParameterTrendChartProps) {
  const { data: trend, isLoading } = useQuery({
    queryKey: ['parameter-trend', parametro, periodo],
    queryFn: async () => {
      const response = await api.get(`/salute/parametri/${encodeURIComponent(parametro)}/trend?periodo=${periodo}`);
      return response.data.data || response.data;
    },
  });

  if (isLoading) {
    return <Card><CardContent className="p-6">Caricamento trend...</CardContent></Card>;
  }

  if (!trend || trend.misurazioni.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trend {parametro}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Dati insufficienti per visualizzare il trend</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = trend.misurazioni.map((m: any) => ({
    data: new Date(m.data).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
    valore: m.valore,
    rangeMin: m.range.minimo,
    rangeMax: m.range.massimo,
    anomalia: m.anomalia,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trend {parametro}</span>
          <div className="flex items-center gap-2">
            {trend.trend === 'miglioramento' && (
              <Badge variant="outline" className="text-green-600">
                <TrendingDown className="w-3 h-3 mr-1" />
                Miglioramento {trend.trendPercentuale?.toFixed(1)}%
              </Badge>
            )}
            {trend.trend === 'peggioramento' && (
              <Badge variant="destructive">
                <TrendingUp className="w-3 h-3 mr-1" />
                Peggioramento {trend.trendPercentuale?.toFixed(1)}%
              </Badge>
            )}
            {trend.trend === 'stabile' && (
              <Badge variant="outline">Stabile</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            valore: { label: parametro, color: "hsl(221.2, 83.2%, 53.3%)" },
            rangeMin: { label: "Range Min", color: "hsl(0, 84.2%, 60.2%)" },
            rangeMax: { label: "Range Max", color: "hsl(0, 84.2%, 60.2%)" },
          }}
          className="h-[300px]"
        >
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="data" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="valore"
              stroke="hsl(221.2, 83.2%, 53.3%)"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            {trend.range.minimo && (
              <ReferenceLine
                y={trend.range.minimo}
                stroke="red"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
            )}
            {trend.range.massimo && (
              <ReferenceLine
                y={trend.range.massimo}
                stroke="red"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />
            )}
          </LineChart>
        </ChartContainer>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Ultimo Valore</p>
            <p className="text-lg font-semibold">
              {trend.ultimoValore?.valore.toFixed(2)} {trend.ultimoValore?.unitaMisura}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Media</p>
            <p className="text-lg font-semibold">
              {trend.media?.toFixed(2)} {trend.ultimoValore?.unitaMisura}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Range</p>
            <p className="text-lg font-semibold">
              {trend.range.minimo?.toFixed(2)} - {trend.range.massimo?.toFixed(2)} {trend.ultimoValore?.unitaMisura}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




