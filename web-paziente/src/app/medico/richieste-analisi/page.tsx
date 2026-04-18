"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/shared/Loading";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";

export default function RichiesteAnalisiPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [richiestaSelezionata, setRichiestaSelezionata] = useState<any | null>(null);
  const [dialogAperto, setDialogAperto] = useState(false);
  const [tipoDialog, setTipoDialog] = useState<"approva" | "rifiuta">("approva");
  const [analisiApprovate, setAnalisiApprovate] = useState<any[]>([]);
  const [noteMedico, setNoteMedico] = useState<string>("");
  const [motivoRifiuto, setMotivoRifiuto] = useState<string>("");

  // Carica richieste in attesa
  const { data: richieste, isLoading } = useQuery<any[]>({
    queryKey: ["medico-richieste-analisi"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(
        "/medico/richieste-analisi?stato=in_attesa"
      );
      return response.data.data || [];
    },
  });

  // Mutation per approvare richiesta
  const approvaMutation = useMutation({
    mutationFn: async (data: { richiestaId: number; analisiApprovate?: any[]; noteMedico?: string }) => {
      const response = await api.post<ApiResponse<any>>(
        `/medico/richieste-analisi/${data.richiestaId}/approva`,
        {
          analisiApprovate: data.analisiApprovate,
          noteMedico: data.noteMedico,
        }
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: "Richiesta approvata",
        description: "La prescrizione analisi è stata creata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["medico-richieste-analisi"] });
      setDialogAperto(false);
      setRichiestaSelezionata(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.error?.message || "Errore durante l'approvazione",
        variant: "destructive",
      });
    },
  });

  // Mutation per rifiutare richiesta
  const rifiutaMutation = useMutation({
    mutationFn: async (data: { richiestaId: number; motivo: string }) => {
      const response = await api.post<ApiResponse<any>>(
        `/medico/richieste-analisi/${data.richiestaId}/rifiuta`,
        { motivo: data.motivo }
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: "Richiesta rifiutata",
        description: "La richiesta è stata rifiutata e il paziente è stato notificato.",
      });
      queryClient.invalidateQueries({ queryKey: ["medico-richieste-analisi"] });
      setDialogAperto(false);
      setRichiestaSelezionata(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.error?.message || "Errore durante il rifiuto",
        variant: "destructive",
      });
    },
  });

  const apriDialog = (richiesta: any, tipo: "approva" | "rifiuta") => {
    setRichiestaSelezionata(richiesta);
    setTipoDialog(tipo);
    if (tipo === "approva") {
      // Inizializza con analisi richieste
      setAnalisiApprovate(
        Array.isArray(richiesta.analisiRichieste)
          ? richiesta.analisiRichieste
          : []
      );
    } else {
      setMotivoRifiuto("");
    }
    setDialogAperto(true);
  };

  const handleApprova = () => {
    if (!richiestaSelezionata) return;
    approvaMutation.mutate({
      richiestaId: richiestaSelezionata.id,
      analisiApprovate: analisiApprovate.length > 0 ? analisiApprovate : undefined,
      noteMedico: noteMedico.trim() || undefined,
    });
  };

  const handleRifiuta = () => {
    if (!richiestaSelezionata || !motivoRifiuto.trim()) {
      toast({
        title: "Attenzione",
        description: "Inserisci un motivo per il rifiuto",
        variant: "destructive",
      });
      return;
    }
    rifiutaMutation.mutate({
      richiestaId: richiestaSelezionata.id,
      motivo: motivoRifiuto.trim(),
    });
  };

  const getUrgenzaBadge = (urgenza: string) => {
    switch (urgenza) {
      case "molto_urgente":
        return <Badge variant="destructive">Molto Urgente</Badge>;
      case "urgente":
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Urgente</Badge>;
      default:
        return <Badge variant="outline">Normale</Badge>;
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Richieste Analisi</h1>
        <p className="text-gray-600 mt-1">
          Gestisci le richieste di analisi dai tuoi pazienti
        </p>
      </div>

      {/* Lista Richieste */}
      {richieste && richieste.length > 0 ? (
        <div className="space-y-4">
          {richieste.map((richiesta) => (
            <Card key={richiesta.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Richiesta da {richiesta.paziente.nome} {richiesta.paziente.cognome}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {getUrgenzaBadge(richiesta.urgenza)}
                      <Badge variant="outline">
                        {richiesta.tipoRichiesta.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {new Date(richiesta.dataRichiesta).toLocaleDateString("it-IT")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Info Paziente */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">Paziente</span>
                  </div>
                  <p className="text-sm">
                    {richiesta.paziente.nome} {richiesta.paziente.cognome}
                  </p>
                  {richiesta.paziente.codiceFiscale && (
                    <p className="text-xs text-gray-600">
                      CF: {richiesta.paziente.codiceFiscale}
                    </p>
                  )}
                  {richiesta.paziente.telefono && (
                    <p className="text-xs text-gray-600">Tel: {richiesta.paziente.telefono}</p>
                  )}
                </div>

                {/* Analisi Richieste */}
                <div>
                  <Label className="mb-2 block">Analisi Richieste</Label>
                  <div className="space-y-2">
                    {Array.isArray(richiesta.analisiRichieste) &&
                      richiesta.analisiRichieste.map((analisi: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <p className="font-medium text-sm">{analisi.nome}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Tipo: {analisi.tipo}
                          </p>
                          {analisi.motivo && (
                            <p className="text-xs text-gray-600 mt-1">
                              Motivo: {analisi.motivo}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Motivo e Note */}
                {richiesta.motivo && (
                  <div>
                    <Label>Motivo Richiesta</Label>
                    <p className="text-sm text-gray-700 mt-1">{richiesta.motivo}</p>
                  </div>
                )}
                {richiesta.notePaziente && (
                  <div>
                    <Label>Note Paziente</Label>
                    <p className="text-sm text-gray-700 mt-1">{richiesta.notePaziente}</p>
                  </div>
                )}

                {/* Azioni */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => apriDialog(richiesta, "approva")}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approva
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => apriDialog(richiesta, "rifiuta")}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rifiuta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Nessuna richiesta in attesa</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog Approva */}
      <Dialog open={dialogAperto && tipoDialog === "approva"} onOpenChange={setDialogAperto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approva Richiesta Analisi</DialogTitle>
            <DialogDescription>
              Crea una prescrizione analisi per il paziente. Puoi modificare le analisi richieste.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {richiestaSelezionata && (
              <>
                <div>
                  <Label>Analisi da Prescrivere</Label>
                  <div className="mt-2 space-y-2">
                    {Array.isArray(richiestaSelezionata.analisiRichieste) &&
                      richiestaSelezionata.analisiRichieste.map(
                        (analisi: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                          >
                            <p className="font-medium text-sm">{analisi.nome}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Tipo: {analisi.tipo}
                            </p>
                          </div>
                        )
                      )}
                  </div>
                </div>
                <div>
                  <Label>Note Medico (opzionale)</Label>
                  <Textarea
                    value={noteMedico}
                    onChange={(e) => setNoteMedico(e.target.value)}
                    placeholder="Note aggiuntive per la prescrizione..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAperto(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleApprova}
              disabled={approvaMutation.isPending}
            >
              {approvaMutation.isPending ? "Approvazione..." : "Approva e Crea Prescrizione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rifiuta */}
      <Dialog open={dialogAperto && tipoDialog === "rifiuta"} onOpenChange={setDialogAperto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Richiesta Analisi</DialogTitle>
            <DialogDescription>
              Inserisci un motivo per il rifiuto. Il paziente riceverà una notifica.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo Rifiuto *</Label>
              <Textarea
                value={motivoRifiuto}
                onChange={(e) => setMotivoRifiuto(e.target.value)}
                placeholder="Spiega perché la richiesta viene rifiutata..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAperto(false)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleRifiuta}
              disabled={rifiutaMutation.isPending || !motivoRifiuto.trim()}
            >
              {rifiutaMutation.isPending ? "Rifiuto..." : "Rifiuta Richiesta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

