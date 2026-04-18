"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Share2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/shared/Loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AderenzaPage() {
  const [periodo, setPeriodo] = useState("30");
  const [selectedTerapiaId, setSelectedTerapiaId] = useState<number | null>(null);
  const { toast } = useToast();

  // Carica terapie attive
  const { data: terapie } = useQuery({
    queryKey: ["terapie"],
    queryFn: async () => {
      const response = await api.get("/paziente/terapie");
      return response.data;
    },
  });

  // Carica report aderenza
  const { data: reportAderenza, isLoading } = useQuery({
    queryKey: ["aderenza", "report", periodo, selectedTerapiaId],
    queryFn: async () => {
      const response = await api.get("/paziente/aderenza-terapia");
      return response.data;
    },
    enabled: true,
  });

  // Condividi con medico
  const condividiMutation = useMutation({
    mutationFn: async (medicoId: number) => {
      const response = await api.post(`/aderenza/condividi-medico/${medicoId}`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Report condiviso",
        description: "Il report di aderenza è stato condiviso con il medico.",
      });
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const percentualeAderenza = reportAderenza?.percentualeAderenza || 0;
  const coloreAderenza =
    percentualeAderenza >= 80 ? "text-green-600" : percentualeAderenza >= 60 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Report Aderenza Terapia</h1>
        <p className="text-gray-600 mt-2">
          Monitora la tua aderenza alle terapie prescritte
        </p>
      </div>

      <div className="space-y-6">
        {/* Filtri */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label>Periodo</Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Ultimi 7 giorni</SelectItem>
                    <SelectItem value="30">Ultimi 30 giorni</SelectItem>
                    <SelectItem value="90">Ultimi 90 giorni</SelectItem>
                    <SelectItem value="365">Ultimo anno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label>Terapia</Label>
                <Select
                  value={selectedTerapiaId?.toString() || "tutte"}
                  onValueChange={(value) => setSelectedTerapiaId(value === "tutte" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutte">Tutte le terapie</SelectItem>
                    {terapie?.map((terapia: any) => (
                      <SelectItem key={terapia.id} value={terapia.id.toString()}>
                        {terapia.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiche Principali */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Aderenza Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                <span className={coloreAderenza}>{percentualeAderenza.toFixed(1)}%</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {percentualeAderenza >= 80
                  ? "Eccellente aderenza"
                  : percentualeAderenza >= 60
                  ? "Buona aderenza"
                  : "Aderenza da migliorare"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Assunzioni Registrate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {reportAderenza?.assunzioniRegistrate || 0}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                su {reportAderenza?.assunzioniPreviste || 0} previste
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Giorni Monitorati</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {reportAderenza?.giorniMonitorati || 0}
              </div>
              <p className="text-sm text-gray-500 mt-2">Nel periodo selezionato</p>
            </CardContent>
          </Card>
        </div>

        {/* Grafico e Dettagli */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Andamento Aderenza
              </CardTitle>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Condividi con Medico
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Condividi Report con Medico</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {terapie?.map((terapia: any) => (
                        <div key={terapia.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{terapia.nome}</p>
                            <p className="text-sm text-gray-500">
                              Dott. {terapia.medicoNome} {terapia.medicoCognome}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => condividiMutation.mutate(terapia.medicoId)}
                            disabled={condividiMutation.isPending}
                          >
                            Condividi
                          </Button>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Esporta PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Qui si potrebbe integrare un grafico con una libreria come recharts */}
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Grafico aderenza (da integrare con libreria grafici)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


