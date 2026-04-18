"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle2, XCircle, Clock, Calendar, Pill, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/shared/Loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RichiestaRinnovo {
  id: number;
  terapiaId: number;
  terapiaNome: string;
  medicoNome: string;
  medicoCognome: string;
  stato: string;
  giorniRimanenti: number;
  dataRichiesta: string;
  quantitaScatole: number;
}

export default function RichiesteRinnovoPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRichiesta, setSelectedRichiesta] = useState<RichiestaRinnovo | null>(null);
  const [motivo, setMotivo] = useState("");

  // Carica richieste rinnovo
  const { data: richieste, isLoading } = useQuery({
    queryKey: ["richieste-rinnovo"],
    queryFn: async () => {
      const response = await api.get("/paziente/richieste-rinnovo");
      return response.data;
    },
  });

  // Conferma richiesta
  const confermaMutation = useMutation({
    mutationFn: async (richiestaId: number) => {
      const response = await api.post(`/paziente/richieste-rinnovo/${richiestaId}/conferma`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["richieste-rinnovo"] });
      toast({
        title: "Richiesta confermata",
        description: "La richiesta di rinnovo è stata confermata.",
      });
    },
  });

  // Posticipa richiesta
  const posticipaMutation = useMutation({
    mutationFn: async (richiestaId: number) => {
      const response = await api.post(`/paziente/richieste-rinnovo/${richiestaId}/posticipa`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["richieste-rinnovo"] });
      toast({
        title: "Richiesta posticipata",
        description: "La richiesta è stata posticipata.",
      });
    },
  });

  // Segnala cambio terapia
  const cambioTerapiaMutation = useMutation({
    mutationFn: async (data: { richiestaId: number; motivo: string }) => {
      const response = await api.post(
        `/paziente/richieste-rinnovo/${data.richiestaId}/cambio-terapia`,
        { motivo: data.motivo }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["richieste-rinnovo"] });
      setSelectedRichiesta(null);
      setMotivo("");
      toast({
        title: "Cambio terapia segnalato",
        description: "Il medico è stato informato del cambio terapia.",
      });
    },
  });

  // Sospendi terapia
  const sospendiMutation = useMutation({
    mutationFn: async (richiestaId: number) => {
      const response = await api.post(`/paziente/richieste-rinnovo/${richiestaId}/sospendi`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["richieste-rinnovo"] });
      toast({
        title: "Terapia sospesa",
        description: "La terapia è stata sospesa.",
      });
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const richiesteAttive: RichiestaRinnovo[] = richieste || [];

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case "in_attesa":
        return <Badge variant="outline">In Attesa</Badge>;
      case "approvata":
        return <Badge className="bg-green-500">Approvata</Badge>;
      case "rifiutata":
        return <Badge variant="destructive">Rifiutata</Badge>;
      case "completata":
        return <Badge className="bg-blue-500">Completata</Badge>;
      default:
        return <Badge>{stato}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Richieste Rinnovo</h1>
        <p className="text-gray-600 mt-2">
          Gestisci le richieste di rinnovo prescrizioni
        </p>
      </div>

      {richiesteAttive.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Nessuna richiesta di rinnovo attiva</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {richiesteAttive.map((richiesta) => (
            <Card key={richiesta.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Pill className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold">{richiesta.terapiaNome}</h3>
                      {getStatoBadge(richiesta.stato)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Medico: Dott. {richiesta.medicoNome} {richiesta.medicoCognome}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Richiesta: {new Date(richiesta.dataRichiesta).toLocaleDateString("it-IT")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {richiesta.giorniRimanenti} giorni rimanenti
                      </span>
                      <span>Quantità: {richiesta.quantitaScatole} scatole</span>
                    </div>
                    {richiesta.giorniRimanenti <= 5 && (
                      <Alert className="mt-3 border-yellow-200 bg-yellow-50">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-sm text-yellow-800">
                          Attenzione: rimangono pochi giorni di terapia
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  {richiesta.stato === "in_attesa" && (
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => confermaMutation.mutate(richiesta.id)}
                        disabled={confermaMutation.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Conferma
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => posticipaMutation.mutate(richiesta.id)}
                        disabled={posticipaMutation.isPending}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Posticipa
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRichiesta(richiesta)}
                          >
                            Cambio Terapia
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Segnala Cambio Terapia</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="motivo">Motivo del cambio</Label>
                              <Textarea
                                id="motivo"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Descrivi il motivo del cambio terapia..."
                                rows={4}
                              />
                            </div>
                            <Button
                              onClick={() =>
                                cambioTerapiaMutation.mutate({
                                  richiestaId: richiesta.id,
                                  motivo,
                                })
                              }
                              disabled={!motivo.trim() || cambioTerapiaMutation.isPending}
                              className="w-full"
                            >
                              Invia Segnalazione
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => sospendiMutation.mutate(richiesta.id)}
                        disabled={sospendiMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Sospendi
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
