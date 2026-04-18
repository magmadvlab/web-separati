"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExamComparisonChart } from "./ExamComparisonChart";
import api from "@/lib/api";

export function ExamComparisonSelector() {
  const [esame1Id, setEsame1Id] = useState<number | null>(null);
  const [esame2Id, setEsame2Id] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const { data: prescrizioni } = useQuery({
    queryKey: ['prescrizioni-analisi'],
    queryFn: async () => {
      const response = await api.get('/salute/analisi/prescrizioni');
      return response.data.data || response.data;
    },
  });

  // Estrai tutti gli esami dalle prescrizioni
  const esami = prescrizioni?.flatMap((p: any) =>
    p.esamiAnalisi?.map((e: any) => ({
      id: e.id,
      nome: e.nomeEsame,
      data: e.dataEsecuzione,
      prescrizione: p.id,
    })) || []
  ) || [];

  const handleCompare = () => {
    if (esame1Id && esame2Id && esame1Id !== esame2Id) {
      setShowComparison(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confronto Esami</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Seleziona Esame 1</label>
            <Select
              value={esame1Id?.toString() || ""}
              onValueChange={(value) => setEsame1Id(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona esame" />
              </SelectTrigger>
              <SelectContent>
                {esami.map((esame: any) => (
                  <SelectItem key={esame.id} value={esame.id.toString()}>
                    {esame.nome} - {new Date(esame.data).toLocaleDateString('it-IT')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Seleziona Esame 2</label>
            <Select
              value={esame2Id?.toString() || ""}
              onValueChange={(value) => setEsame2Id(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona esame" />
              </SelectTrigger>
              <SelectContent>
                {esami
                  .filter((e: any) => e.id !== esame1Id)
                  .map((esame: any) => (
                    <SelectItem key={esame.id} value={esame.id.toString()}>
                      {esame.nome} - {new Date(esame.data).toLocaleDateString('it-IT')}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={handleCompare}
          disabled={!esame1Id || !esame2Id || esame1Id === esame2Id}
        >
          Confronta
        </Button>

        {showComparison && esame1Id && esame2Id && (
          <div className="mt-6">
            <ExamComparisonChart esame1Id={esame1Id} esame2Id={esame2Id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}




