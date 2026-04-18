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
  Calendar,
  User,
  Pill,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default function MedicoReportPrescrizioniPazientePage() {
  const params = useParams();
  const router = useRouter();
  const pazienteId = parseInt(params.id as string);

  const { data: prescrizioni, isLoading, error } = useQuery<Prescrizione[]>({
    queryKey: ["medico-prescrizioni-paziente", pazienteId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prescrizione[]>>(
        `/medico/prescrizioni/paziente/${pazienteId}`
      );
      return response.data.data;
    },
    enabled: !!pazienteId,
  });

  const { data: paziente } = useQuery<any>({
    queryKey: ["medico-paziente", pazienteId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(
        `/medico/pazienti`
      );
      const pazienti = response.data.data || [];
      return pazienti.find((p: any) => p.id === pazienteId);
    },
    enabled: !!pazienteId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error || !prescrizioni) {
    return <NotFound message="Prescrizioni non trovate" />;
  }

  const getStatusColor = (stato: string) => {
    switch (stato?.toLowerCase()) {
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

  const prescrizioniAttive = prescrizioni.filter(
    (p) => p.stato === "attiva" && p.dataValidita && new Date(p.dataValidita) >= new Date()
  );
  const prescrizioniScadute = prescrizioni.filter(
    (p) => p.dataValidita && new Date(p.dataValidita) < new Date()
  );
  const prescrizioniUtilizzate = prescrizioni.filter(
    (p) => p.stato === "utilizzata" || p.stato === "completata"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Report Prescrizioni</h1>
            {paziente && (
              <p className="text-gray-600 mt-1">
                {paziente.nome} {paziente.cognome}
                {paziente.codiceFiscale && ` - ${paziente.codiceFiscale}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totale Prescrizioni</p>
                <p className="text-2xl font-bold">{prescrizioni.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prescrizioni Attive</p>
                <p className="text-2xl font-bold text-green-600">{prescrizioniAttive.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prescrizioni Scadute</p>
                <p className="text-2xl font-bold text-red-600">{prescrizioniScadute.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista Prescrizioni */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Storico Prescrizioni ({prescrizioni.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescrizioni.length > 0 ? (
            <div className="space-y-4">
              {prescrizioni.map((prescrizione) => {
                const farmaci = Array.isArray(prescrizione.farmaci)
                  ? prescrizione.farmaci
                  : typeof prescrizione.farmaci === "string"
                  ? JSON.parse(prescrizione.farmaci)
                  : [];
                const isScaduta = prescrizione.dataValidita
                  ? new Date(prescrizione.dataValidita) < new Date()
                  : false;

                return (
                  <div
                    key={prescrizione.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link href={`/medico/prescrizioni/${prescrizione.id}`}>
                            <h4 className="font-semibold text-lg hover:text-blue-600 cursor-pointer">
                              {prescrizione.numeroRicetta || `Prescrizione #${prescrizione.id}`}
                            </h4>
                          </Link>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              prescrizione.stato
                            )}`}
                          >
                            {prescrizione.stato}
                          </span>
                          {isScaduta && (
                            <span className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Scaduta
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">Data Emissione:</span>{" "}
                            {new Date(prescrizione.dataEmissione).toLocaleDateString("it-IT")}
                          </div>
                          <div>
                            <span className="font-medium">Data Validità:</span>{" "}
                            {prescrizione.dataValidita
                              ? new Date(prescrizione.dataValidita).toLocaleDateString("it-IT")
                              : "-"}
                          </div>
                          {prescrizione.codiceNre && (
                            <div>
                              <span className="font-medium">NRE:</span>{" "}
                              <span className="font-mono">{prescrizione.codiceNre}</span>
                            </div>
                          )}
                        </div>

                        {farmaci.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Farmaci:</p>
                            <div className="flex flex-wrap gap-2">
                              {farmaci.slice(0, 3).map((farmaco: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                                >
                                  {farmaco.nomeFarmaco || farmaco.nome || `Farmaco ${idx + 1}`}
                                </span>
                              ))}
                              {farmaci.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{farmaci.length - 3} altri
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <Link href={`/medico/prescrizioni/${prescrizione.id}`}>
                        <Button variant="ghost" size="sm">
                          Dettagli
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">
              Nessuna prescrizione trovata per questo paziente
            </p>
          )}
        </CardContent>
      </Card>

      {/* Suggerimento Controllo */}
      {prescrizioniScadute.length > 0 && prescrizioniAttive.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Suggerimento Controllo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-900">
              Il paziente ha {prescrizioniScadute.length} prescrizione/i scaduta/e e nessuna
              prescrizione attiva. Potrebbe essere necessario un controllo in studio.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

