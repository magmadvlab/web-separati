"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Activity } from "lucide-react";
import api from "@/lib/api";
import { BloodPressureDiary } from "./BloodPressureDiary";
import { useState } from "react";

export function DiariesList() {
  const queryClient = useQueryClient();
  const [selectedDiary, setSelectedDiary] = useState<number | null>(null);

  const { data: diari, isLoading } = useQuery({
    queryKey: ['health-diaries'],
    queryFn: async () => {
      const response = await api.get('/salute/diari');
      return response.data.data || response.data;
    },
  });

  if (isLoading) {
    return <Card><CardContent className="p-6">Caricamento diari...</CardContent></Card>;
  }

  if (selectedDiary) {
    return (
      <div>
        <Button onClick={() => setSelectedDiary(null)} variant="outline" className="mb-4">
          ← Torna ai diari
        </Button>
        <BloodPressureDiary diarioId={selectedDiary} />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Diari Misurazioni</span>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Crea Nuovo Diario
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!diari || diari.length === 0 ? (
          <p className="text-gray-600">Nessun diario creato. Crea il tuo primo diario!</p>
        ) : (
          diari.map((diario: any) => (
            <div
              key={diario.id}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedDiary(diario.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold">{diario.nomeDiario}</h3>
                    <p className="text-sm text-gray-600">
                      Tipo: {diario.tipoDiario} • Stato: {diario.stato}
                    </p>
                    {diario.ultimaMisurazione && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ultima misurazione: {new Date(diario.ultimaMisurazione.dataOraMisurazione).toLocaleDateString('it-IT')}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={diario.stato === 'attivo' ? 'default' : 'secondary'}>
                  {diario.stato}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}




