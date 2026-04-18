"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { Plus, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface BloodPressureDiaryProps {
  diarioId: number;
}

export function BloodPressureDiary({ diarioId }: BloodPressureDiaryProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [sistolica, setSistolica] = useState("");
  const [diastolica, setDiastolica] = useState("");
  const [contesto, setContesto] = useState("mattina");
  const [posizione, setPosizione] = useState("seduto");

  const { data: trend, isLoading } = useQuery({
    queryKey: ['blood-pressure-trend', diarioId],
    queryFn: async () => {
      const response = await api.get(`/salute/diari/${diarioId}/trend?periodo=30`);
      return response.data.data || response.data;
    },
  });

  const recordMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/salute/diari/${diarioId}/misurazioni`, data);
      return response.data.data || response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blood-pressure-trend', diarioId] });
      setShowForm(false);
      setSistolica("");
      setDiastolica("");
      toast({
        title: "Misurazione registrata",
        description: "La tua pressione è stata salvata con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordMutation.mutate({
      valore1: parseFloat(sistolica),
      valore2: parseFloat(diastolica),
      dataOra: new Date().toISOString(),
      contesto,
      posizione,
    });
  };

  if (isLoading) return <div>Caricamento...</div>;

  const chartData = trend?.misurazioni?.map((m: any) => ({
    data: new Date(m.dataOra).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
    sistolica: m.sistolica,
    diastolica: m.diastolica,
    anomalia: m.anomalia,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Diario Pressione Sanguigna</span>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nuova Misurazione
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sistolica">Pressione Sistolica (mmHg)</Label>
                <Input
                  id="sistolica"
                  type="number"
                  value={sistolica}
                  onChange={(e) => setSistolica(e.target.value)}
                  required
                  min="50"
                  max="250"
                />
              </div>
              <div>
                <Label htmlFor="diastolica">Pressione Diastolica (mmHg)</Label>
                <Input
                  id="diastolica"
                  type="number"
                  value={diastolica}
                  onChange={(e) => setDiastolica(e.target.value)}
                  required
                  min="30"
                  max="150"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contesto">Contesto</Label>
                <select
                  id="contesto"
                  value={contesto}
                  onChange={(e) => setContesto(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="mattina">Mattina</option>
                  <option value="sera">Sera</option>
                  <option value="prima_pasto">Prima del pasto</option>
                  <option value="dopo_pasto">Dopo il pasto</option>
                </select>
              </div>
              <div>
                <Label htmlFor="posizione">Posizione</Label>
                <select
                  id="posizione"
                  value={posizione}
                  onChange={(e) => setPosizione(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="seduto">Seduto</option>
                  <option value="in_piedi">In piedi</option>
                  <option value="sdraiato">Sdraiato</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={recordMutation.isPending}>
                Salva Misurazione
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Annulla
              </Button>
            </div>
          </form>
        )}

        {trend?.medie && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded">
              <p className="text-sm text-gray-600">Media Sistolica</p>
              <p className="text-2xl font-bold">{trend.medie.sistolica.toFixed(1)} mmHg</p>
              {trend.trend.sistolica.direction === 'miglioramento' && (
                <Badge variant="outline" className="text-green-600 mt-2">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Miglioramento
                </Badge>
              )}
              {trend.trend.sistolica.direction === 'peggioramento' && (
                <Badge variant="destructive" className="mt-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Peggioramento
                </Badge>
              )}
            </div>
            <div className="text-center p-4 border rounded">
              <p className="text-sm text-gray-600">Media Diastolica</p>
              <p className="text-2xl font-bold">{trend.medie.diastolica.toFixed(1)} mmHg</p>
              {trend.trend.diastolica.direction === 'miglioramento' && (
                <Badge variant="outline" className="text-green-600 mt-2">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Miglioramento
                </Badge>
              )}
              {trend.trend.diastolica.direction === 'peggioramento' && (
                <Badge variant="destructive" className="mt-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Peggioramento
                </Badge>
              )}
            </div>
            <div className="text-center p-4 border rounded">
              <p className="text-sm text-gray-600">Misurazioni Anomale</p>
              <p className="text-2xl font-bold">{trend.statistiche.misurazioniAnomale}</p>
              <p className="text-sm text-gray-500 mt-1">
                {trend.statistiche.percentualeAnomale.toFixed(1)}% del totale
              </p>
            </div>
          </div>
        )}

        {chartData.length > 0 && (
          <ChartContainer
            config={{
              sistolica: { label: "Sistolica", color: "hsl(221.2, 83.2%, 53.3%)" },
              diastolica: { label: "Diastolica", color: "hsl(142.1, 76.2%, 36.3%)" },
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
                dataKey="sistolica"
                stroke="hsl(221.2, 83.2%, 53.3%)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="diastolica"
                stroke="hsl(142.1, 76.2%, 36.3%)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <ReferenceLine y={140} stroke="red" strokeDasharray="5 5" label="Max Sistolica" />
              <ReferenceLine y={90} stroke="red" strokeDasharray="5 5" label="Max Diastolica" />
            </LineChart>
          </ChartContainer>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4">Ultime Misurazioni</h3>
          <div className="space-y-2">
            {trend?.misurazioni?.slice(-10).reverse().map((m: any, idx: number) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 border rounded ${
                  m.anomalia ? 'bg-red-50 border-red-200' : ''
                }`}
              >
                <div>
                  <p className="font-medium">
                    {m.sistolica}/{m.diastolica} mmHg
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(m.dataOra).toLocaleString('it-IT')} - {m.contesto}
                  </p>
                </div>
                {m.anomalia && (
                  <Badge variant="destructive">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {m.gravitaAnomalia}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




