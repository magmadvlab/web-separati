"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import type { ApiResponse, Prescrizione } from "@/types/api";
import {
  ArrowLeft,
  FileText,
  User,
  Pill,
  ShoppingCart,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function DettaglioPrescrizionePage() {
  const params = useParams();
  const prescrizioneId = parseInt(params.id as string);

  const { data: prescrizione, isLoading, error } = useQuery<Prescrizione>({
    queryKey: ["paziente-prescrizione", prescrizioneId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prescrizione>>(
        `/paziente/prescrizioni/${prescrizioneId}`
      );
      return response.data.data;
    },
    enabled: !!prescrizioneId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error || !prescrizione) {
    return <NotFound message="Prescrizione non trovata" />;
  }

  // Parsa il campo JSON farmaci
  const farmaci = Array.isArray(prescrizione.farmaci)
    ? prescrizione.farmaci
    : typeof prescrizione.farmaci === "string"
    ? JSON.parse(prescrizione.farmaci)
    : [];

  const getStatusColor = (stato: string) => {
    switch (stato.toLowerCase()) {
      case "attiva":
        return "bg-green-100 text-green-800 border-green-200";
      case "scaduta":
        return "bg-red-100 text-red-800 border-red-200";
      case "utilizzata":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const isAttiva = prescrizione.stato === "attiva" && prescrizione.dataScadenza
    ? new Date(prescrizione.dataScadenza) >= new Date()
    : prescrizione.stato === "attiva";

  const isScaduta = prescrizione.dataScadenza
    ? new Date(prescrizione.dataScadenza) < new Date()
    : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/prescrizioni">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle prescrizioni
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dettaglio Prescrizione</h1>
            <p className="text-gray-600 mt-1">
              {prescrizione.numeroRicetta
                ? `Ricetta N. ${prescrizione.numeroRicetta}`
                : `Prescrizione #${prescrizione.id}`}
            </p>
          </div>
        </div>
        {isAttiva && (
          <Link href={`/prescrizioni/${prescrizione.id}/nuovo-ordine`}>
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Crea Ordine
            </Button>
          </Link>
        )}
      </div>

      {/* Alert Stato */}
      {isScaduta && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">Questa prescrizione è scaduta</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonna principale - Informazioni e Farmaci */}
        <div className="md:col-span-2 space-y-6">
          {/* Informazioni Prescrizione */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informazioni Prescrizione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stato</p>
                  <span
                    className={`inline-block mt-1 rounded-full px-3 py-1 text-sm border ${getStatusColor(
                      prescrizione.stato
                    )}`}
                  >
                    {prescrizione.stato}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Data Emissione</p>
                  <p className="mt-1">
                    {new Date(prescrizione.dataEmissione).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {prescrizione.dataScadenza && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Data Validità</p>
                    <p className="mt-1">
                      {new Date(prescrizione.dataScadenza).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {prescrizione.codiceNre && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Codice NRE</p>
                    <p className="mt-1 font-mono text-sm">{prescrizione.codiceNre}</p>
                  </div>
                )}
                {prescrizione.tipo && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tipo</p>
                    <p className="mt-1">{prescrizione.tipo}</p>
                  </div>
                )}
                {prescrizione.ripetibile !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ripetibile</p>
                    <p className="mt-1">
                      {prescrizione.ripetibile ? (
                        <span className="text-green-600">Sì</span>
                      ) : (
                        <span className="text-gray-600">No</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              {prescrizione.noteMedico && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-600 mb-2">Note del Medico</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {prescrizione.noteMedico}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Farmaci Prescritti */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Farmaci Prescritti ({farmaci.length})
                <span className="text-xs font-normal text-red-600 bg-red-100 px-2 py-1 rounded ml-2">
                  <FileText className="h-3 w-3 inline mr-1" />
                  Richiedono Prescrizione
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {farmaci.length > 0 ? (
                <div className="space-y-3">
                  {farmaci.map((farmaco: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-red-200 bg-red-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">
                              {farmaco.nomeFarmaco || farmaco.nome || "Farmaco"}
                            </p>
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Richiede Ricetta
                            </span>
                          </div>
                          {farmaco.principioAttivo && (
                            <p className="text-sm text-gray-600 mt-1">
                              {farmaco.principioAttivo}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-3 text-sm">
                            {farmaco.quantita && (
                              <div>
                                <span className="text-gray-600">Quantità: </span>
                                <span className="font-medium">{farmaco.quantita}</span>
                              </div>
                            )}
                            {farmaco.posologia && (
                              <div>
                                <span className="text-gray-600">Posologia: </span>
                                <span className="font-medium">{farmaco.posologia}</span>
                              </div>
                            )}
                            {farmaco.dosaggio && (
                              <div>
                                <span className="text-gray-600">Dosaggio: </span>
                                <span className="font-medium">{farmaco.dosaggio}</span>
                              </div>
                            )}
                          </div>
                          {farmaco.note && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              {farmaco.note}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">
                  Nessun farmaco presente nella prescrizione
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonna laterale - Medico e Info Aggiuntive */}
        <div className="space-y-6">
          {/* Informazioni Medico */}
          {prescrizione.medico && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Medico Prescrittore
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">
                    Dr. {prescrizione.medico.nome} {prescrizione.medico.cognome}
                  </p>
                  {prescrizione.medico.specializzazione && (
                    <p className="text-sm text-gray-600 mt-1">
                      {prescrizione.medico.specializzazione}
                    </p>
                  )}
                </div>
                {prescrizione.medico.telefono && (
                  <div>
                    <p className="text-xs text-gray-600">Telefono</p>
                    <p className="text-sm">{prescrizione.medico.telefono}</p>
                  </div>
                )}
                {prescrizione.medico.emailProfessionale && (
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="text-sm">{prescrizione.medico.emailProfessionale}</p>
                  </div>
                )}
                {prescrizione.medico.indirizzoStudio && (
                  <div>
                    <p className="text-xs text-gray-600">Studio</p>
                    <p className="text-sm">
                      {prescrizione.medico.indirizzoStudio}
                      {prescrizione.medico.citta && `, ${prescrizione.medico.citta}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Azioni */}
          <Card>
            <CardHeader>
              <CardTitle>Azioni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {prescrizione.filePdfPath && (
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={prescrizione.filePdfPath}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Scarica PDF
                  </a>
                </Button>
              )}
              {isAttiva && (
                <Link href={`/prescrizioni/${prescrizione.id}/nuovo-ordine`} className="block">
                  <Button className="w-full">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Crea Ordine
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Ordini Correlati */}
          {prescrizione.ordini && prescrizione.ordini.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Ordini Correlati
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prescrizione.ordini.map((ordine: any) => (
                    <Link
                      key={ordine.id}
                      href={`/ordini/${ordine.id}`}
                      className="block p-2 rounded border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            Ordine #{ordine.id}
                          </p>
                          <p className="text-xs text-gray-600">
                            {ordine.farmacia?.nome}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                          {ordine.stato}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terapie Correlate */}
          {prescrizione.terapie && prescrizione.terapie.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Terapie Attive
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {prescrizione.terapie.map((terapia: any) => (
                    <div
                      key={terapia.id}
                      className="p-2 rounded border bg-green-50 border-green-200"
                    >
                      <p className="text-sm font-medium">
                        {terapia.farmaco?.nomeCommerciale || "Terapia"}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {terapia.posologia}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {terapia.stato === "attiva" && "Attiva"}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

