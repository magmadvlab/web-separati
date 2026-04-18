"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { Calendar, Clock, Building2, FileText, Trash2, Eye } from "lucide-react";
import Link from "next/link";

interface Prenotazione {
  id: number;
  codicePrenotazione: string;
  dataOraAppuntamento: string;
  stato: string;
  tipoPagamento: string;
  importoTotale?: number;
  laboratorio: {
    id: number;
    nome: string;
    citta: string;
  };
  servizio: {
    id: number;
    nome: string;
  };
  ordineConsegna?: {
    id: number;
    stato: string;
    rider?: {
      nome: string;
      cognome: string;
    };
  };
}

const statiBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  prenotata: { label: "Prenotata", variant: "default" },
  confermata: { label: "Confermata", variant: "secondary" },
  completata: { label: "Completata", variant: "secondary" },
  risultato_disponibile: { label: "Risultato Disponibile", variant: "default" },
  cancellata: { label: "Cancellata", variant: "destructive" },
};

export default function ListaPrenotazioniPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filtroStato, setFiltroStato] = useState<string>("all");

  const { data: prenotazioni, isLoading } = useQuery<Prenotazione[]>({
    queryKey: ["prenotazioni", filtroStato],
    queryFn: async () => {
      const params = filtroStato && filtroStato !== "all" ? `?stato=${filtroStato}` : "";
      const response = await api.get<ApiResponse<Prenotazione[]>>(`/salute/prenotazioni${params}`);
      return response.data.data || [];
    },
  });

  const cancellaPrenotazioneMutation = useMutation({
    mutationFn: async (prenotazioneId: number) => {
      await api.post(`/salute/prenotazioni/${prenotazioneId}/cancella`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prenotazioni"] });
      toast({
        title: "Prenotazione cancellata",
        description: "La prenotazione è stata cancellata con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante la cancellazione",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Le Mie Prenotazioni</h1>
        <Link href="/paziente/esami/prenota">
          <Button>Nuova Prenotazione</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={filtroStato} onValueChange={setFiltroStato}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="prenotata">Prenotata</SelectItem>
                <SelectItem value="confermata">Confermata</SelectItem>
                <SelectItem value="completata">Completata</SelectItem>
                <SelectItem value="risultato_disponibile">Risultato Disponibile</SelectItem>
                <SelectItem value="cancellata">Cancellata</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {prenotazioni && prenotazioni.length > 0 ? (
        <div className="space-y-4">
          {prenotazioni.map((prenotazione) => {
            const statoBadge = statiBadge[prenotazione.stato] || { label: prenotazione.stato, variant: "default" };
            const dataOra = new Date(prenotazione.dataOraAppuntamento);

            return (
              <Card key={prenotazione.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{prenotazione.servizio.nome}</h3>
                        <Badge variant={statoBadge.variant}>{statoBadge.label}</Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          <span>{prenotazione.laboratorio.nome} - {prenotazione.laboratorio.citta}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{dataOra.toLocaleDateString("it-IT")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{dataOra.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>Codice: {prenotazione.codicePrenotazione}</span>
                        </div>
                        {prenotazione.importoTotale && (
                          <div className="text-sm font-medium">
                            Totale: €{Number(prenotazione.importoTotale).toFixed(2)}
                          </div>
                        )}
                        {prenotazione.ordineConsegna && (
                          <div className="text-sm">
                            Consegna: {prenotazione.ordineConsegna.stato}
                            {prenotazione.ordineConsegna.rider && (
                              <span> - Rider: {prenotazione.ordineConsegna.rider.nome} {prenotazione.ordineConsegna.rider.cognome}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/paziente/esami/prenotazioni/${prenotazione.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Dettagli
                      </Button>
                      {prenotazione.stato !== "cancellata" && prenotazione.stato !== "completata" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("Sei sicuro di voler cancellare questa prenotazione?")) {
                              cancellaPrenotazioneMutation.mutate(prenotazione.id);
                            }
                          }}
                          disabled={cancellaPrenotazioneMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Cancella
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Nessuna prenotazione trovata</p>
            <div className="mt-4 text-center">
              <Link href="/paziente/esami/prenota">
                <Button>Prenota un Esame</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

