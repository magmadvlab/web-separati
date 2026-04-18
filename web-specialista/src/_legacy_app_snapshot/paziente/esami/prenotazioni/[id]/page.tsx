"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import type { ApiResponse } from "@/types/api";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  FileText,
  Euro,
  Truck,
  CreditCard,
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
  laboratorio: {
    id: number;
    nome: string;
    indirizzo: string;
    citta: string;
    provincia: string;
    telefono?: string;
    email?: string;
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
    dataAssegnazione?: string;
    dataConsegna?: string;
    rider?: {
      id: number;
      nome: string;
      cognome: string;
      telefono: string;
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

export default function DettaglioPrenotazionePage() {
  const params = useParams();
  const prenotazioneId = parseInt(params.id as string);

  const { data: prenotazione, isLoading, error } = useQuery<Prenotazione>({
    queryKey: ["prenotazione", prenotazioneId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prenotazione>>(`/salute/prenotazioni/${prenotazioneId}`);
      return response.data.data;
    },
    enabled: !!prenotazioneId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error || !prenotazione) {
    return <NotFound message="Prenotazione non trovata" />;
  }

  const statoBadge = statiBadge[prenotazione.stato] || { label: prenotazione.stato, variant: "default" };
  const dataOra = new Date(prenotazione.dataOraAppuntamento);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/paziente/esami/prenotazioni" className="flex items-center text-sm text-gray-500 hover:underline">
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
              <Building2 className="h-5 w-5 text-blue-600" /> Informazioni Laboratorio
            </h3>
            <div className="grid gap-2">
              <p className="font-medium">{prenotazione.laboratorio.nome}</p>
              <p>{prenotazione.laboratorio.indirizzo}</p>
              <p>
                {prenotazione.laboratorio.citta} ({prenotazione.laboratorio.provincia})
              </p>
              {prenotazione.laboratorio.telefono && <p>Tel: {prenotazione.laboratorio.telefono}</p>}
              {prenotazione.laboratorio.email && <p>Email: {prenotazione.laboratorio.email}</p>}
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
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-yellow-600" /> Riepilogo Costi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Tipo Pagamento:</span>
            <span className="font-medium capitalize">{prenotazione.tipoPagamento}</span>
          </div>
          {prenotazione.ticket && (
            <div className="flex justify-between text-sm">
              <span>Ticket SSN:</span>
              <span className="font-medium">€{Number(prenotazione.ticket).toFixed(2)}</span>
            </div>
          )}
          {prenotazione.importoSSN && prenotazione.importoSSN > 0 && (
            <div className="flex justify-between text-sm">
              <span>Importo SSN:</span>
              <span className="font-medium">€{Number(prenotazione.importoSSN).toFixed(2)}</span>
            </div>
          )}
          {prenotazione.importoPrivato && prenotazione.importoPrivato > 0 && (
            <div className="flex justify-between text-sm">
              <span>Importo Privato:</span>
              <span className="font-medium">€{Number(prenotazione.importoPrivato).toFixed(2)}</span>
            </div>
          )}
          {prenotazione.importoTotale && (
            <div className="flex justify-between text-base font-bold pt-2 border-t mt-2">
              <span>Totale:</span>
              <span>€{Number(prenotazione.importoTotale).toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {prenotazione.statoPagamento && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" /> Stato Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Stato:</span>
              <Badge variant={prenotazione.statoPagamento === "paid" ? "default" : "secondary"}>
                {prenotazione.statoPagamento}
              </Badge>
            </div>
            {prenotazione.metodoPagamento && (
              <div className="flex justify-between text-sm">
                <span>Metodo:</span>
                <span className="font-medium capitalize">{prenotazione.metodoPagamento}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {prenotazione.consegnaDomicilio && prenotazione.ordineConsegna && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-600" /> Consegna Risultati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Stato:</span>
              <Badge variant="outline">{prenotazione.ordineConsegna.stato}</Badge>
            </div>
            <div className="text-sm">
              <span className="font-medium">Indirizzo:</span> {prenotazione.ordineConsegna.indirizzoConsegna}
            </div>
            {prenotazione.ordineConsegna.rider && (
              <div className="text-sm">
                <span className="font-medium">Rider:</span> {prenotazione.ordineConsegna.rider.nome}{" "}
                {prenotazione.ordineConsegna.rider.cognome} - Tel: {prenotazione.ordineConsegna.rider.telefono}
              </div>
            )}
            {prenotazione.ordineConsegna.dataAssegnazione && (
              <div className="text-sm">
                <span className="font-medium">Assegnato il:</span>{" "}
                {new Date(prenotazione.ordineConsegna.dataAssegnazione).toLocaleString("it-IT")}
              </div>
            )}
            {prenotazione.ordineConsegna.dataConsegna && (
              <div className="text-sm">
                <span className="font-medium">Consegnato il:</span>{" "}
                {new Date(prenotazione.ordineConsegna.dataConsegna).toLocaleString("it-IT")}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(prenotazione.notePaziente || prenotazione.noteLaboratorio) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" /> Note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prenotazione.notePaziente && (
              <div>
                <h4 className="font-medium mb-1">Note Paziente:</h4>
                <p className="text-sm text-gray-600">{prenotazione.notePaziente}</p>
              </div>
            )}
            {prenotazione.noteLaboratorio && (
              <div>
                <h4 className="font-medium mb-1">Note Laboratorio:</h4>
                <p className="text-sm text-gray-600">{prenotazione.noteLaboratorio}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


