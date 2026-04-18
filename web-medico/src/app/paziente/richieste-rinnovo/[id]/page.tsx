"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import type { ApiResponse } from "@/types/api";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Pill,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface RichiestaRinnovo {
  id: number;
  stato: string;
  dataRichiesta: string;
  dataApprovazione?: string;
  motivo?: string;
  notePaziente?: string;
  noteMedico?: string;
  giorniRimanenti?: number;
  quantitaScatole?: number;
  ripetibile?: boolean;
  numeroRipetizioni?: number;
  terapia?: {
    id: number;
    posologia?: string;
    farmaco?: {
      id: number;
      nomeCommerciale: string;
      principioAttivo?: string;
      formaFarmaceutica?: string;
      dosaggio?: string;
    };
    prescrizione?: {
      id: number;
      numeroRicetta?: string;
      dataValidita?: string;
    };
  };
  medico?: {
    id: number;
    nome: string;
    cognome: string;
    specializzazione?: string;
  };
  prescrizione?: {
    id: number;
    numeroRicetta?: string;
    dataEmissione: string;
    dataValidita: string;
  };
  nuovaPrescrizione?: {
    id: number;
    numeroRicetta?: string;
    codiceNre?: string;
    dataEmissione: string;
    dataValidita: string;
  };
}

export default function PazienteDettaglioRichiestaRinnovoPage() {
  const params = useParams();
  const richiestaId = parseInt(params.id as string);

  const { data: richiesta, isLoading, error } = useQuery<RichiestaRinnovo>({
    queryKey: ["paziente-richiesta-rinnovo", richiestaId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RichiestaRinnovo>>(
        `/paziente/richieste-rinnovo/${richiestaId}`
      );
      return response.data.data;
    },
    enabled: !!richiestaId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error || !richiesta) {
    return <NotFound message="Richiesta non trovata" />;
  }

  const getStatusBadge = (stato: string) => {
    switch (stato) {
      case "in_attesa":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            In Attesa
          </Badge>
        );
      case "approvata":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approvata
          </Badge>
        );
      case "rifiutata":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rifiutata
          </Badge>
        );
      default:
        return <Badge variant="outline">{stato}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/paziente/richieste-rinnovo">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle richieste
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dettaglio Richiesta Rinnovo</h1>
            <p className="text-gray-600 mt-1">Richiesta #{richiesta.id}</p>
          </div>
        </div>
        {getStatusBadge(richiesta.stato)}
      </div>

      {/* Informazioni Principali */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Dettagli Medico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Medico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {richiesta.medico ? (
              <>
                <div>
                  <p className="text-sm font-medium text-gray-600">Nome Completo</p>
                  <p className="text-lg font-semibold">
                    Dr. {richiesta.medico.nome} {richiesta.medico.cognome}
                  </p>
                </div>
                {richiesta.medico.specializzazione && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Specializzazione</p>
                    <p className="text-sm">{richiesta.medico.specializzazione}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-400">Medico non disponibile</p>
            )}
          </CardContent>
        </Card>

        {/* Informazioni Richiesta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informazioni Richiesta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Richiesta</p>
              <p className="text-sm">
                {new Date(richiesta.dataRichiesta).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {richiesta.dataApprovazione && (
              <div>
                <p className="text-sm font-medium text-gray-600">Data Risposta</p>
                <p className="text-sm">
                  {new Date(richiesta.dataApprovazione).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
            {richiesta.motivo && (
              <div>
                <p className="text-sm font-medium text-gray-600">Motivo</p>
                <p className="text-sm">{richiesta.motivo}</p>
              </div>
            )}
            {richiesta.notePaziente && (
              <div>
                <p className="text-sm font-medium text-gray-600">Tue Note</p>
                <p className="text-sm whitespace-pre-wrap">{richiesta.notePaziente}</p>
              </div>
            )}
            {richiesta.noteMedico && (
              <div>
                <p className="text-sm font-medium text-gray-600">Note del Medico</p>
                <p className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded">
                  {richiesta.noteMedico}
                </p>
              </div>
            )}
            {richiesta.giorniRimanenti !== undefined && (
              <div>
                <p className="text-sm font-medium text-gray-600">Giorni Rimanenti</p>
                <p
                  className={`text-sm font-semibold ${
                    richiesta.giorniRimanenti <= 7
                      ? "text-red-600"
                      : richiesta.giorniRimanenti <= 14
                      ? "text-yellow-600"
                      : ""
                  }`}
                >
                  {richiesta.giorniRimanenti} giorni
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Farmaco e Terapia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Farmaco Richiesto
          </CardTitle>
        </CardHeader>
        <CardContent>
          {richiesta.terapia?.farmaco ? (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">
                      {richiesta.terapia.farmaco.nomeCommerciale}
                    </h4>
                    {richiesta.terapia.farmaco.principioAttivo && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Principio attivo:</span>{" "}
                        {richiesta.terapia.farmaco.principioAttivo}
                      </p>
                    )}
                    {richiesta.terapia.farmaco.formaFarmaceutica && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Forma:</span>{" "}
                        {richiesta.terapia.farmaco.formaFarmaceutica}
                      </p>
                    )}
                    {richiesta.terapia.farmaco.dosaggio && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Dosaggio:</span>{" "}
                        {richiesta.terapia.farmaco.dosaggio}
                      </p>
                    )}
                    {richiesta.terapia.posologia && (
                      <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Posologia:</span> {richiesta.terapia.posologia}
                      </p>
                    )}
                    {richiesta.quantitaScatole && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">Scatole richieste:</span>{" "}
                        <span className="text-blue-600 font-semibold">
                          {richiesta.quantitaScatole}
                        </span>
                      </p>
                    )}
                    {richiesta.prescrizione && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm font-medium text-gray-600">Prescrizione Originale</p>
                        <p className="text-sm">
                          Numero: {richiesta.prescrizione.numeroRicetta || "N/A"}
                        </p>
                        {richiesta.prescrizione.dataValidita && (
                          <p className="text-xs text-gray-500">
                            Valida fino:{" "}
                            {new Date(richiesta.prescrizione.dataValidita).toLocaleDateString(
                              "it-IT"
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">Informazioni farmaco non disponibili</p>
          )}
        </CardContent>
      </Card>

      {/* Messaggio Stato */}
      {richiesta.stato === "in_attesa" && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Richiesta in attesa</p>
                <p className="text-sm text-yellow-700 mt-1">
                  La tua richiesta di rinnovo è stata inviata al medico. Riceverai una notifica quando
                  verrà esaminata.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {richiesta.stato === "approvata" && richiesta.nuovaPrescrizione && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Richiesta approvata</p>
                <p className="text-sm text-green-700 mt-1">
                  Il medico ha approvato la tua richiesta e ha creato una nuova prescrizione.
                </p>
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-green-900">
                    Nuova Prescrizione #{richiesta.nuovaPrescrizione.id}
                  </p>
                  {richiesta.nuovaPrescrizione.numeroRicetta && (
                    <p className="text-sm text-green-700">
                      Numero Ricetta: {richiesta.nuovaPrescrizione.numeroRicetta}
                    </p>
                  )}
                  {richiesta.nuovaPrescrizione.codiceNre && (
                    <p className="text-sm text-green-700">
                      Codice NRE: {richiesta.nuovaPrescrizione.codiceNre}
                    </p>
                  )}
                  <p className="text-sm text-green-700">
                    Valida fino:{" "}
                    {new Date(richiesta.nuovaPrescrizione.dataValidita).toLocaleDateString("it-IT")}
                  </p>
                  <Link href={`/prescrizioni/${richiesta.nuovaPrescrizione.id}`}>
                    <Button className="mt-3 bg-green-600 hover:bg-green-700">
                      Vedi Prescrizione
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {richiesta.stato === "rifiutata" && richiesta.noteMedico && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Richiesta rifiutata</p>
                <p className="text-sm text-red-700 mt-1">{richiesta.noteMedico}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}



