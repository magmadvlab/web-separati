// REWRITTEN — usa /laboratorio/richieste-prenotazione (richieste_prenotazione_esami con laboratorioId)
// Azioni: conferma / riprogramma / rifiuta
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Stethoscope,
  User,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";

interface RichiestaAnalisi {
  id: number;
  tipoRichiesta: string;
  analisiRichieste: Array<{ nome: string; tipo?: string; motivo?: string }> | unknown;
  motivo?: string | null;
  notePaziente?: string | null;
  urgenza?: string | null;
  createdAt?: string;
  dataRichiesta?: string;
  paziente: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale?: string | null;
  };
  medico?: {
    id: number;
    nome: string;
    cognome: string;
    specializzazione?: string | null;
  } | null;
}

interface ServizioLaboratorio {
  id: number;
  nome: string;
  attivo?: boolean;
}

function toArrayAnalisi(value: RichiestaAnalisi["analisiRichieste"]) {
  return Array.isArray(value) ? value : [];
}

function getErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    fallback
  );
}

export default function RichiesteAnalisiLaboratorioPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [richiestaSelezionata, setRichiestaSelezionata] = useState<RichiestaAnalisi | null>(null);
  const [dialogAperto, setDialogAperto] = useState(false);
  const [tipoDialog, setTipoDialog] = useState<"approva" | "rifiuta">("approva");
  const [servizioId, setServizioId] = useState<string>("");
  const [dataOraAppuntamento, setDataOraAppuntamento] = useState<string>("");
  const [noteLaboratorio, setNoteLaboratorio] = useState<string>("");
  const [motivoRifiuto, setMotivoRifiuto] = useState<string>("");

  const { data: richieste, isLoading } = useQuery<RichiestaAnalisi[]>({
    queryKey: ["laboratorio-richieste-analisi"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RichiestaAnalisi[]>>(
        "/laboratori/dashboard/richieste-analisi?stato=in_attesa",
      );
      return response.data.data || [];
    },
  });

  const { data: servizi } = useQuery<ServizioLaboratorio[]>({
    queryKey: ["laboratorio-servizi"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ServizioLaboratorio[]>>("/laboratori/dashboard/servizi");
      return response.data.data || [];
    },
  });

  const approvaMutation = useMutation({
    mutationFn: async (payload: {
      richiestaId: number;
      servizioId: number;
      dataOraAppuntamento: string;
      note?: string;
    }) => {
      const response = await api.post<ApiResponse<any>>(
        `/laboratori/dashboard/richieste-analisi/${payload.richiestaId}/accetta`,
        {
          servizioId: payload.servizioId,
          dataOraAppuntamento: payload.dataOraAppuntamento,
          note: payload.note,
        },
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: "Richiesta accettata",
        description: "Prenotazione esame creata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["laboratorio-richieste-analisi"] });
      setDialogAperto(false);
      setRichiestaSelezionata(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: getErrorMessage(error, "Errore durante l'accettazione"),
        variant: "destructive",
      });
    },
  });

  const rifiutaMutation = useMutation({
    mutationFn: async (payload: { richiestaId: number; motivo: string }) => {
      const response = await api.post<ApiResponse<any>>(
        `/laboratori/dashboard/richieste-analisi/${payload.richiestaId}/rifiuta`,
        { motivo: payload.motivo },
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: "Richiesta rifiutata",
        description: "La richiesta è stata rifiutata.",
      });
      queryClient.invalidateQueries({ queryKey: ["laboratorio-richieste-analisi"] });
      setDialogAperto(false);
      setRichiestaSelezionata(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: getErrorMessage(error, "Errore durante il rifiuto"),
        variant: "destructive",
      });
    },
  });

  const apriDialog = (richiesta: RichiestaAnalisi, tipo: "approva" | "rifiuta") => {
    setRichiestaSelezionata(richiesta);
    setTipoDialog(tipo);
    setDialogAperto(true);

    if (tipo === "approva") {
      setServizioId("");
      setDataOraAppuntamento("");
      setNoteLaboratorio("");
    } else {
      setMotivoRifiuto("");
    }
  };

  const handleAccetta = () => {
    if (!richiestaSelezionata) return;
    if (!servizioId || !dataOraAppuntamento) {
      toast({
        title: "Dati mancanti",
        description: "Seleziona servizio e data/ora appuntamento.",
        variant: "destructive",
      });
      return;
    }

    approvaMutation.mutate({
      richiestaId: richiestaSelezionata.id,
      servizioId: Number(servizioId),
      dataOraAppuntamento,
      note: noteLaboratorio.trim() || undefined,
    });
  };

  const handleRifiuta = () => {
    if (!richiestaSelezionata) return;
    if (!motivoRifiuto.trim()) {
      toast({
        title: "Dati mancanti",
        description: "Inserisci il motivo del rifiuto.",
        variant: "destructive",
      });
      return;
    }

    rifiutaMutation.mutate({
      richiestaId: richiestaSelezionata.id,
      motivo: motivoRifiuto.trim(),
    });
  };

  const getUrgenzaBadge = (urgenza?: string | null) => {
    switch (urgenza) {
      case "molto_urgente":
        return <Badge variant="destructive">Molto urgente</Badge>;
      case "urgente":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-700">
            Urgente
          </Badge>
        );
      default:
        return <Badge variant="outline">Normale</Badge>;
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Richieste Analisi</h1>
        <p className="text-gray-600 mt-1">Gestisci le richieste ricevute dai medici curanti.</p>
      </div>

      {richieste && richieste.length > 0 ? (
        <div className="space-y-4">
          {richieste.map((richiesta) => {
            const dataRichiesta = richiesta.createdAt || richiesta.dataRichiesta;
            const analisi = toArrayAnalisi(richiesta.analisiRichieste);
            return (
              <Card key={richiesta.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Richiesta da {richiesta.paziente?.nome} {richiesta.paziente?.cognome}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {getUrgenzaBadge(richiesta.urgenza)}
                        <Badge variant="outline">{(richiesta.tipoRichiesta || "analisi").replaceAll("_", " ")}</Badge>
                      </div>
                    </div>
                    {dataRichiesta && (
                      <div className="text-sm text-gray-600 whitespace-nowrap">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {new Date(dataRichiesta).toLocaleDateString("it-IT")}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">Paziente</span>
                      </div>
                      <p className="text-sm">
                        {richiesta.paziente?.nome} {richiesta.paziente?.cognome}
                      </p>
                      {richiesta.paziente?.codiceFiscale && (
                        <p className="text-xs text-gray-600">CF: {richiesta.paziente.codiceFiscale}</p>
                      )}
                    </div>

                    {richiesta.medico && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Stethoscope className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">Medico</span>
                        </div>
                        <p className="text-sm">
                          {richiesta.medico.nome} {richiesta.medico.cognome}
                        </p>
                        {richiesta.medico.specializzazione && (
                          <p className="text-xs text-gray-600">{richiesta.medico.specializzazione}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="mb-2 block">Analisi richieste</Label>
                    <div className="space-y-2">
                      {analisi.length > 0 ? (
                        analisi.map((item, index) => (
                          <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="font-medium text-sm">{item?.nome || "Analisi"}</p>
                            {item?.tipo && <p className="text-xs text-gray-600 mt-1">Tipo: {item.tipo}</p>}
                            {item?.motivo && <p className="text-xs text-gray-600 mt-1">Motivo: {item.motivo}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">Nessun dettaglio analisi disponibile</p>
                      )}
                    </div>
                  </div>

                  {richiesta.motivo && (
                    <div>
                      <Label>Motivo richiesta</Label>
                      <p className="text-sm text-gray-700 mt-1">{richiesta.motivo}</p>
                    </div>
                  )}
                  {richiesta.notePaziente && (
                    <div>
                      <Label>Note paziente</Label>
                      <p className="text-sm text-gray-700 mt-1">{richiesta.notePaziente}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={() => apriDialog(richiesta, "approva")} className="flex-1">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accetta
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
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Nessuna richiesta analisi in attesa</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogAperto && tipoDialog === "approva"} onOpenChange={setDialogAperto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accetta Richiesta Analisi</DialogTitle>
            <DialogDescription>
              Seleziona servizio e data/ora per creare la prenotazione dell&apos;esame.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Servizio *</Label>
              <Select value={servizioId} onValueChange={setServizioId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Seleziona servizio" />
                </SelectTrigger>
                <SelectContent>
                  {(servizi || []).map((servizio) => (
                    <SelectItem key={servizio.id} value={String(servizio.id)}>
                      {servizio.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data e ora appuntamento *</Label>
              <Input
                type="datetime-local"
                className="mt-2"
                value={dataOraAppuntamento}
                onChange={(e) => setDataOraAppuntamento(e.target.value)}
              />
            </div>

            <div>
              <Label>Note laboratorio (opzionale)</Label>
              <Textarea
                className="mt-2"
                rows={3}
                placeholder="Note per la prenotazione..."
                value={noteLaboratorio}
                onChange={(e) => setNoteLaboratorio(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAperto(false)}>
              Annulla
            </Button>
            <Button onClick={handleAccetta} disabled={approvaMutation.isPending}>
              {approvaMutation.isPending ? "Salvataggio..." : "Accetta e prenota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogAperto && tipoDialog === "rifiuta"} onOpenChange={setDialogAperto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Richiesta Analisi</DialogTitle>
            <DialogDescription>Inserisci il motivo del rifiuto.</DialogDescription>
          </DialogHeader>

          <div>
            <Label>Motivo rifiuto *</Label>
            <Textarea
              className="mt-2"
              rows={4}
              value={motivoRifiuto}
              onChange={(e) => setMotivoRifiuto(e.target.value)}
              placeholder="Spiega il motivo del rifiuto..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogAperto(false)}>
              Annulla
            </Button>
            <Button variant="destructive" onClick={handleRifiuta} disabled={rifiutaMutation.isPending}>
              {rifiutaMutation.isPending ? "Salvataggio..." : "Conferma rifiuto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
