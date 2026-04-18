"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Stethoscope, CheckCircle2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { Badge } from "@/components/ui/badge";

export function ReminderVisitaMedico() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reminders } = useQuery<any[]>({
    queryKey: ["reminder-visita-medico"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/paziente/reminder-visita-medico");
      return response.data.data;
    },
  });

  const completaMutation = useMutation({
    mutationFn: async (medicoId: number) => {
      const response = await api.post<ApiResponse<any>>(
        "/paziente/reminder-visita-medico/completa",
        { medicoId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminder-visita-medico"] });
      toast({
        title: "Visita registrata",
        description: "Il reminder è stato aggiornato. La prossima visita è tra 6 mesi.",
      });
    },
  });

  if (!reminders || reminders.length === 0) {
    return null;
  }

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Stethoscope className="h-5 w-5" />
          Consiglio Visita Medica
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reminders.map((reminder) => {
          const dataProssimaVisita = new Date(reminder.dataProssimaVisita);
          const giorniRimanenti = Math.ceil(
            (dataProssimaVisita.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24)
          );
          const isScaduto = giorniRimanenti <= 0;

          return (
            <div key={reminder.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className={`h-5 w-5 mt-0.5 ${isScaduto ? 'text-red-600' : 'text-orange-600'}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">
                      È consigliabile una visita di controllo con il Dr. {reminder.medico.nome} {reminder.medico.cognome}
                    </p>
                    {isScaduto && (
                      <Badge variant="destructive" className="text-xs">
                        Scaduto
                      </Badge>
                    )}
                    {!isScaduto && giorniRimanenti <= 7 && (
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                        Urgente
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Ultima visita: {new Date(reminder.dataUltimaVisita).toLocaleDateString('it-IT')}
                  </p>
                  <p className="text-xs text-gray-600">
                    Prossima visita consigliata: {new Date(reminder.dataProssimaVisita).toLocaleDateString('it-IT')}
                  </p>
                  {!isScaduto && (
                    <p className="text-xs text-orange-700 mt-1 font-medium">
                      {giorniRimanenti === 1 
                        ? 'Manca 1 giorno' 
                        : `Mancano ${giorniRimanenti} giorni`}
                    </p>
                  )}
                  <p className="text-xs text-orange-700 mt-2 italic">
                    Questo è solo un consiglio, non un obbligo.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => completaMutation.mutate(reminder.medicoId)}
                  disabled={completaMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Ho fatto la visita
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

