"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, TrendingUp, Activity, Droplet } from "lucide-react";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

interface WellnessData {
  terapieAttive: number;
  assunzioniUltimi30Giorni: number;
  donazioniUltimoAnno: number;
  scoreWellness: number;
  ultimoAggiornamento: string;
}

export function WellnessScore() {
  const { data: wellnessData, isLoading } = useQuery<WellnessData>({
    queryKey: ["paziente-wellness-analytics"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<WellnessData>>("/paziente/wellness-analytics");
      return response.data.data || response.data;
    },
    refetchInterval: 5 * 60 * 1000, // Ricarica ogni 5 minuti
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">Caricamento wellness score...</div>
        </CardContent>
      </Card>
    );
  }

  if (!wellnessData) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Eccellente", variant: "default" as const };
    if (score >= 60) return { label: "Buono", variant: "secondary" as const };
    if (score >= 40) return { label: "Discreto", variant: "outline" as const };
    return { label: "Da migliorare", variant: "destructive" as const };
  };

  const scoreBadge = getScoreBadge(wellnessData.scoreWellness);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          Wellness Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Score principale */}
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(wellnessData.scoreWellness)}`}>
              {wellnessData.scoreWellness}
              <span className="text-2xl text-gray-400">/100</span>
            </div>
            <Badge variant={scoreBadge.variant} className="mt-2">
              {scoreBadge.label}
            </Badge>
          </div>

          {/* Dettagli */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Terapie Attive</div>
                <div className="text-lg font-semibold">{wellnessData.terapieAttive}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Assunzioni (30gg)</div>
                <div className="text-lg font-semibold">{wellnessData.assunzioniUltimi30Giorni}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="p-2 bg-red-100 rounded-full">
                <Droplet className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Donazioni (anno)</div>
                <div className="text-lg font-semibold">{wellnessData.donazioniUltimoAnno}</div>
              </div>
            </div>
          </div>

          {/* Info calcolo */}
          <div className="text-xs text-gray-500 text-center pt-2">
            Il wellness score è calcolato in base a terapie gestite, aderenza e donazioni
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
