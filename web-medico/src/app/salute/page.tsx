"use client";

import { HealthAlerts } from "@/components/salute/HealthAlerts";
import { SuggestionsCard } from "@/components/salute/SuggestionsCard";
import { ParameterTrendChart } from "@/components/salute/ParameterTrendChart";
import { ExamComparisonSelector } from "@/components/salute/ExamComparisonSelector";
import { DiariesList } from "@/components/salute/DiariesList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function SalutePage() {
  const { data: dashboard } = useQuery({
    queryKey: ['health-dashboard'],
    queryFn: async () => {
      const response = await api.get('/salute/dashboard');
      return response.data.data || response.data;
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Salute</h1>

      {/* Alert */}
      <HealthAlerts />

      {/* Overview Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Terapie Attive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{dashboard.terapieAttive}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Aderenza Media</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{dashboard.aderenzaMedia?.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Prossimi Controlli</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{dashboard.prossimiControlli?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Analisi in Scadenza</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{dashboard.analisiInScadenza?.length || 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suggerimenti */}
      <SuggestionsCard />

      {/* Confronto Esami */}
      <ExamComparisonSelector />

      {/* Diari Misurazioni */}
      <DiariesList />

      {/* Trend Parametri Principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ParameterTrendChart parametro="Colesterolo totale" periodo={12} />
        <ParameterTrendChart parametro="Glicemia" periodo={12} />
        <ParameterTrendChart parametro="Trigliceridi" periodo={12} />
        <ParameterTrendChart parametro="Creatinina" periodo={12} />
      </div>
    </div>
  );
}

