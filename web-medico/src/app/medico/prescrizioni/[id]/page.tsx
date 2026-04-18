"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import type { ApiResponse, Prescrizione } from "@/types/api";
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Pill,
  Download,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

export default function MedicoDettaglioPrescrizionePage() {
  const params = useParams();
  const prescrizioneId = parseInt(params.id as string);

  const { data: prescrizione, isLoading, error } = useQuery<Prescrizione>({
    queryKey: ["medico-prescrizione", prescrizioneId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prescrizione>>(
        `/medico/prescrizioni/${prescrizioneId}`
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
      case "ricevuta":
        return "bg-green-100 text-green-800 border-green-200";
      case "scaduta":
        return "bg-red-100 text-red-800 border-red-200";
      case "utilizzata":
      case "completata":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const isScaduta = prescrizione.dataValidita
    ? new Date(prescrizione.dataValidita) < new Date()
    : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/medico/prescrizioni">
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
      </div>

      {/* Informazioni Principali */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Dettagli Prescrizione */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informazioni Prescrizione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Stato</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                  prescrizione.stato
                )}`}
              >
                {prescrizione.stato}
              </span>
            </div>

            {prescrizione.codiceNre && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">NRE</span>
                <span className="text-sm font-mono font-semibold">
                  {prescrizione.codiceNre}
                </span>
              </div>
            )}

            {prescrizione.numeroRicetta && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Numero Ricetta
                </span>
                <span className="text-sm font-semibold">
                  {prescrizione.numeroRicetta}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Data Emissione
              </span>
              <span className="text-sm">
                {new Date(prescrizione.dataEmissione).toLocaleDateString("it-IT")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Data Validità
              </span>
              <span
                className={`text-sm ${
                  isScaduta ? "text-red-600 font-semibold" : ""
                }`}
              >
                {prescrizione.dataValidita
                  ? new Date(prescrizione.dataValidita).toLocaleDateString("it-IT")
                  : "-"}
                {isScaduta && (
                  <AlertCircle className="h-4 w-4 inline-block ml-1" />
                )}
              </span>
            </div>

            {prescrizione.tipo && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Tipo</span>
                <span className="text-sm capitalize">{prescrizione.tipo}</span>
              </div>
            )}

            {prescrizione.tipoRicetta && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Tipo Ricetta
                </span>
                <span className="text-sm font-semibold">
                  {prescrizione.tipoRicetta}
                </span>
              </div>
            )}

            {prescrizione.ripetibile !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Ripetibile
                </span>
                <span className="text-sm">
                  {prescrizione.ripetibile ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      Sì ({prescrizione.numeroRipetizioni || 0} ripetizioni)
                    </span>
                  ) : (
                    "No"
                  )}
                </span>
              </div>
            )}

            {prescrizione.ripetibile &&
              prescrizione.ripetizioniUtilizzate !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Ripetizioni Utilizzate
                  </span>
                  <span className="text-sm">
                    {prescrizione.ripetizioniUtilizzate} /{" "}
                    {prescrizione.numeroRipetizioni || 0}
                  </span>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Informazioni Paziente */}
        {prescrizione.paziente && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Paziente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Nome</p>
                <p className="text-lg font-semibold">
                  {prescrizione.paziente.nome} {prescrizione.paziente.cognome}
                </p>
              </div>
              {prescrizione.paziente.codiceFiscale && (
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Codice Fiscale
                  </p>
                  <p className="text-sm font-mono">
                    {prescrizione.paziente.codiceFiscale}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Farmaci Prescritti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Farmaci Prescritti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {farmaci && farmaci.length > 0 ? (
            <div className="space-y-4">
              {farmaci.map((farmaco: any, index: number) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">
                        {farmaco.nomeFarmaco || farmaco.nome || `Farmaco ${index + 1}`}
                      </h4>
                      {farmaco.principioAttivo && (
                        <p className="text-sm text-gray-600 mt-1">
                          {farmaco.principioAttivo}
                        </p>
                      )}
                      <div className="mt-2 space-y-1">
                        {farmaco.posologia && (
                          <p className="text-sm">
                            <span className="font-medium">Posologia:</span>{" "}
                            {farmaco.posologia}
                          </p>
                        )}
                        {farmaco.numeroScatole && (
                          <p className="text-sm">
                            <span className="font-medium">Scatole:</span>{" "}
                            {farmaco.numeroScatole}
                          </p>
                        )}
                        {farmaco.doseGiornaliera && (
                          <p className="text-sm">
                            <span className="font-medium">Dose giornaliera:</span>{" "}
                            {farmaco.doseGiornaliera}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">
              Nessun farmaco specificato
            </p>
          )}
        </CardContent>
      </Card>

      {/* Note */}
      {prescrizione.noteMedico && (
        <Card>
          <CardHeader>
            <CardTitle>Note Medico</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {prescrizione.noteMedico}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Azioni */}
      <Card>
        <CardHeader>
          <CardTitle>Azioni</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {prescrizione.filePdfPath && (
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010"}${prescrizione.filePdfPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Scarica PDF
                </a>
              </Button>
            )}

            {prescrizione.paziente && (
              <Button
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href={`/medico/pazienti/${prescrizione.paziente.id}/prescrizioni`}>
                  <User className="h-4 w-4 mr-2" />
                  Report Prescrizioni Paziente
                </Link>
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href="/medico/dashboard">
                <FileText className="h-4 w-4 mr-2" />
                Dashboard Medico
              </Link>
            </Button>
          </div>

          {prescrizione.noteMedico && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Note del medico:</p>
              <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
                {prescrizione.noteMedico}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

