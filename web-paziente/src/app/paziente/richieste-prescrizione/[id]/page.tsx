"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import Link from "next/link";

interface RichiestaPrescrizione {
  id: number;
  stato: string;
  dataRichiesta: string;
  dataApprovazione?: string;
  motivo?: string;
  notePaziente?: string;
  noteMedico?: string;
  farmaciRichiesti: Array<{
    nomeFarmaco: string;
    numeroScatole: number;
    principioAttivo?: string;
    posologia?: string;
    compressePerScatola?: number;
    formaFarmaceutica?: string;
  }>;
  paziente?: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale: string;
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
    codiceNre?: string;
    dataEmissione: string;
    dataValidita: string;
  };
}

export default function PazienteDettaglioRichiestaPrescrizionePage() {
  const params = useParams();
  const router = useRouter();
  const richiestaId = parseInt(params.id as string);

  const { data: richiesta, isLoading, error } = useQuery<RichiestaPrescrizione>({
    queryKey: ["paziente-richiesta-prescrizione", richiestaId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RichiestaPrescrizione>>(
        `/paziente/richieste-prescrizione/${richiestaId}`
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
          <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approvata
          </Badge>
        );
      case "completata":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
            <FileText className="h-3 w-3 mr-1" />
            Prescrizione Disponibile
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

  // Gestisce il caso in cui farmaciRichiesti sia una stringa JSON
  let farmaciRichiesti: any[] = [];
  if (richiesta.farmaciRichiesti) {
    if (typeof richiesta.farmaciRichiesti === 'string') {
      try {
        farmaciRichiesti = JSON.parse(richiesta.farmaciRichiesti);
      } catch (e) {
        console.error('Errore parsing farmaciRichiesti:', e);
        farmaciRichiesti = [];
      }
    } else if (Array.isArray(richiesta.farmaciRichiesti)) {
      farmaciRichiesti = richiesta.farmaciRichiesti;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/paziente/richieste-prescrizione">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle richieste
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dettaglio Richiesta Prescrizione</h1>
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
                <p className="text-sm font-medium text-gray-600">Data Approvazione</p>
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
            {richiesta.prescrizione && (
              <div>
                <p className="text-sm font-medium text-gray-600">Prescrizione Disponibile</p>
                <Link href={`/prescrizioni/${richiesta.prescrizione.id}`}>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    Vedi Prescrizione #{richiesta.prescrizione.id}
                  </Button>
                </Link>
                {richiesta.prescrizione.codiceNre && (
                  <p className="text-xs text-gray-500 mt-1">
                    NRE: {richiesta.prescrizione.codiceNre}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Farmaci Richiesti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Farmaci Richiesti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {farmaciRichiesti.length > 0 ? (
            <div className="space-y-4">
              {farmaciRichiesti.map((farmaco, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{farmaco.nomeFarmaco}</h4>
                      {farmaco.principioAttivo && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Principio attivo:</span> {farmaco.principioAttivo}
                        </p>
                      )}
                      {farmaco.formaFarmaceutica && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Forma:</span> {farmaco.formaFarmaceutica}
                        </p>
                      )}
                      <div className="mt-3 space-y-1">
                        {farmaco.numeroScatole && (
                          <p className="text-sm">
                            <span className="font-medium">Scatole:</span>{" "}
                            <span className="text-blue-600 font-semibold">{farmaco.numeroScatole}</span>
                          </p>
                        )}
                        {farmaco.compressePerScatola && (
                          <p className="text-sm">
                            <span className="font-medium">Compresse per scatola:</span>{" "}
                            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 ml-1">
                              {farmaco.compressePerScatola} (dal catalogo)
                            </Badge>
                          </p>
                        )}
                        {farmaco.posologia && (
                          <p className="text-sm">
                            <span className="font-medium">Posologia:</span> {farmaco.posologia}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">Nessun farmaco specificato</p>
          )}
        </CardContent>
      </Card>

      {/* Messaggio Stato */}
      {richiesta.stato === "approvata" && !richiesta.prescrizione && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">
                  Richiesta approvata dal medico
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Il medico ha approvato la tua richiesta. La prescrizione verrà generata nel software medico e inviata via email. Riceverai una notifica quando sarà disponibile.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {richiesta.stato === "completata" && richiesta.prescrizione && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">
                  Prescrizione disponibile
                </p>
                <p className="text-sm text-green-700 mt-1">
                  La tua prescrizione è stata importata e associata a questa richiesta. Puoi procedere con l'ordine.
                </p>
                <Link href={`/prescrizioni/${richiesta.prescrizione.id}/nuovo-ordine`}>
                  <Button className="mt-3 bg-green-600 hover:bg-green-700">
                    Crea Ordine
                  </Button>
                </Link>
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
                <p className="font-medium text-red-900">
                  Richiesta rifiutata
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {richiesta.noteMedico}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


