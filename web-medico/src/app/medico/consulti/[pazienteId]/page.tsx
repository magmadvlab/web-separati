"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cartellaClinicaApi } from "@/lib/api-cartella-clinica";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { DocumentoCartellaClinica } from "@/types/cartella-clinica";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileText, User } from "lucide-react";

export default function MedicoConsultoDettaglioPage() {
  const params = useParams();
  const pazienteId = Number(params?.pazienteId);

  const { data: documenti, isLoading: documentiLoading } = useQuery<DocumentoCartellaClinica[]>({
    queryKey: ["medico-consulto-documenti", pazienteId],
    queryFn: () => cartellaClinicaApi.getDocumentiMedico(pazienteId),
    enabled: Number.isFinite(pazienteId),
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["medico-consulto-report", pazienteId],
    queryFn: () => cartellaClinicaApi.getReportMedico(pazienteId),
    enabled: Number.isFinite(pazienteId),
  });

  const { data: scheda, isLoading: schedaLoading } = useQuery({
    queryKey: ["medico-consulto-scheda", pazienteId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/medico/pazienti/${pazienteId}/scheda`);
      return response.data.data;
    },
    enabled: Number.isFinite(pazienteId),
  });

  const { data: prescrizioni, isLoading: prescrizioniLoading } = useQuery({
    queryKey: ["medico-consulto-prescrizioni", pazienteId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(
        `/medico/prescrizioni/paziente/${pazienteId}`
      );
      return response.data.data;
    },
    enabled: Number.isFinite(pazienteId),
  });

  if (documentiLoading || reportLoading || schedaLoading || prescrizioniLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Consulto paziente</h1>
          <p className="text-sm text-gray-600">
            Accesso in sola lettura ai dati condivisi per la valutazione clinica.
          </p>
        </div>
        <Link href="/medico/consulti">
          <Button variant="outline">Torna ai consulti</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {scheda?.paziente
              ? `${scheda.paziente.nome} ${scheda.paziente.cognome}`
              : `Paziente #${pazienteId}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-xs text-gray-500">
          {scheda?.paziente?.codiceFiscale && (
            <Badge variant="outline">CF: {scheda.paziente.codiceFiscale}</Badge>
          )}
          {scheda?.paziente?.dataNascita && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {scheda.paziente.dataNascita}
            </span>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="documenti" className="space-y-4">
        <TabsList className="flex flex-wrap gap-2">
          <TabsTrigger value="documenti">Documenti + Analisi</TabsTrigger>
          <TabsTrigger value="storico">Storico</TabsTrigger>
          <TabsTrigger value="terapie">Terapie</TabsTrigger>
          <TabsTrigger value="prescrizioni">Prescrizioni</TabsTrigger>
        </TabsList>

        <TabsContent value="documenti">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documenti condivisi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {documenti && documenti.length > 0 ? (
                documenti.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="font-medium">{doc.titolo || "Documento clinico"}</p>
                      <p className="text-xs text-gray-500">{doc.tipo}</p>
                    </div>
                    <Badge variant="outline">
                      <FileText className="mr-1 h-3 w-3" />
                      {new Date(doc.dataEvento).toLocaleDateString("it-IT")}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Nessun documento condiviso.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storico">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Storico documentazione</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>Totale documenti condivisi: {report?.totale || 0}</p>
              <p>
                Se servono dettagli aggiuntivi, il paziente puo estendere la condivisione
                o inviare nuovi documenti.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="terapie">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Terapie attive</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {scheda?.terapie && scheda.terapie.length > 0 ? (
                scheda.terapie.map((terapia: any) => (
                  <div key={terapia.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="font-medium">{terapia.farmaco?.nomeCommerciale || "Farmaco"}</p>
                      <p className="text-xs text-gray-500">{terapia.posologia}</p>
                    </div>
                    <Badge variant="outline">{terapia.stato}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Nessuna terapia attiva.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescrizioni">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prescrizioni recenti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {prescrizioni && prescrizioni.length > 0 ? (
                prescrizioni.map((prescrizione: any) => (
                  <div key={prescrizione.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <p className="font-medium">NRE: {prescrizione.nre}</p>
                      <p className="text-xs text-gray-500">{prescrizione.stato}</p>
                    </div>
                    <Badge variant="outline">
                      {new Date(prescrizione.dataEmissione).toLocaleDateString("it-IT")}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Nessuna prescrizione disponibile.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
