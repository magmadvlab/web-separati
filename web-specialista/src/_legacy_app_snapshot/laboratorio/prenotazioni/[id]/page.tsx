"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Prenotazione {
  id: number;
  codicePrenotazione: string;
  dataOraAppuntamento: string;
  stato: string;
  tipoPagamento: string;
  importoTotale?: number;
  importoSSN?: number;
  importoPrivato?: number;
  ticket?: number;
  statoPagamento?: string;
  metodoPagamento?: string;
  consegnaDomicilio: boolean;
  indirizzoConsegna?: string;
  notePaziente?: string;
  noteLaboratorio?: string;
  paziente: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale: string;
    telefono?: string;
    emailPersonale?: string;
    indirizzo: string;
    citta: string;
    cap: string;
    provincia: string;
  };
  servizio: {
    id: number;
    nome: string;
    tipoServizio: string;
  };
  prescrizioneAnalisi?: {
    id: number;
    tipo: string;
  };
  transazionePagamento?: {
    id: number;
    stato: string;
    importo: number;
  };
  ordineConsegna?: {
    id: number;
    stato: string;
    indirizzoConsegna: string;
  };
}

export default function DettaglioPrenotazioneLaboratorioPage() {
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prenotazioneId = parseInt(params.id as string);
  const [nuovoStato, setNuovoStato] = useState("");
  const [note, setNote] = useState("");

  const { data: prenotazione, isLoading, error } = useQuery<Prenotazione>({
    queryKey: ["prenotazione-laboratorio", prenotazioneId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prenotazione>>(
        `/laboratori/dashboard/prenotazioni/${prenotazioneId}`
      );
      return response.data.data;
    },
    enabled: !!prenotazioneId,
  });

  const aggiornaStatoMutation = useMutation({
    mutationFn: async ({ stato, note }: { stato: string; note?: string }) => {
      const response = await api.put<ApiResponse<Prenotazione>>(
        `/laboratori/dashboard/prenotazioni/${prenotazioneId}/stato`,
        { stato, note }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prenotazione-laboratorio", prenotazioneId] });
      queryClient.invalidateQueries({ queryKey: ["prenotazioni-laboratorio"] });
      setNuovoStato("");
      setNote("");
      toast({
        title: "Stato aggiornato",
        description: "Lo stato della prenotazione è stato aggiornato",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l&apos;aggiornamento",
        variant: "destructive",
      });
    },
  });

  const _inviaRisultatiMutation = useMutation({
    mutationFn: async (_data: { parametri?: any[]; pdfUrl?: string; pdfBase64?: string; note?: string }) => {
      const _response = await api.post<ApiResponse<any>>(
        `/laboratori/dashboard/prenotazioni/${prenotazioneId}/risultati`,
        _data
      );
      return _response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prenotazione-laboratorio", prenotazioneId] });
      toast({
        title: "Risultati inviati",
        description: "I risultati sono stati inviati con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'invio risultati",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error || !prenotazione) {
    return <NotFound message="Prenotazione non trovata" />;
  }

  const dataOra = new Date(prenotazione.dataOraAppuntamento);
  const statiBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    prenotata: { label: "Prenotata", variant: "default" },
    confermata: { label: "Confermata", variant: "secondary" },
    completata: { label: "Completata", variant: "secondary" },
    risultato_disponibile: { label: "Risultato Disponibile", variant: "default" },
    cancellata: { label: "Cancellata", variant: "destructive" },
  };
  const statoBadge = statiBadge[prenotazione.stato] || { label: prenotazione.stato, variant: "default" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/laboratorio/prenotazioni" className="flex items-center text-sm text-gray-500 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Torna alle prenotazioni
        </Link>
        <h1 className="text-2xl font-bold">Dettaglio Prenotazione</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Codice: {prenotazione.codicePrenotazione}</span>
            <Badge variant={statoBadge.variant}>{statoBadge.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" /> Informazioni Paziente
            </h3>
            <div className="grid gap-2">
              <p className="font-medium">
                {prenotazione.paziente.nome} {prenotazione.paziente.cognome}
              </p>
              <p>CF: {prenotazione.paziente.codiceFiscale}</p>
              {prenotazione.paziente.telefono && <p>Tel: {prenotazione.paziente.telefono}</p>}
              {prenotazione.paziente.emailPersonale && <p>Email: {prenotazione.paziente.emailPersonale}</p>}
              <p>
                {prenotazione.paziente.indirizzo}, {prenotazione.paziente.cap} {prenotazione.paziente.citta} (
                {prenotazione.paziente.provincia})
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" /> Dettagli Appuntamento
            </h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{dataOra.toLocaleDateString("it-IT", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{dataOra.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div>
                <span className="font-medium">Servizio:</span> {prenotazione.servizio.nome}
              </div>
              {prenotazione.prescrizioneAnalisi && (
                <div>
                  <span className="font-medium">Prescrizione:</span> {prenotazione.prescrizioneAnalisi.tipo}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aggiorna Stato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nuovoStato">Nuovo Stato</Label>
            <Select value={nuovoStato} onValueChange={setNuovoStato}>
              <SelectTrigger id="nuovoStato">
                <SelectValue placeholder="Seleziona stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confermata">Confermata</SelectItem>
                <SelectItem value="completata">Completata</SelectItem>
                <SelectItem value="risultato_disponibile">Risultato Disponibile</SelectItem>
                <SelectItem value="cancellata">Cancellata</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              placeholder="Note per il paziente"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              if (!nuovoStato) {
                toast({
                  title: "Errore",
                  description: "Seleziona un nuovo stato",
                  variant: "destructive",
                });
                return;
              }
              aggiornaStatoMutation.mutate({ stato: nuovoStato, note: note || undefined });
            }}
            disabled={aggiornaStatoMutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Aggiorna Stato
          </Button>
        </CardContent>
      </Card>

      {prenotazione.stato === "completata" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-purple-600" /> Invia Risultati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/laboratorio/prenotazioni/${prenotazione.id}/risultati`}>
              <Button className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Inserisci Risultati
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {prenotazione.notePaziente && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" /> Note Paziente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{prenotazione.notePaziente}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


