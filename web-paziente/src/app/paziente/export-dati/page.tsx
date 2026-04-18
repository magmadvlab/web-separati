"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, FileDown, Clock, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/shared/Loading";

interface ExportRequest {
  id: number;
  stato: string;
  dataRichiesta: string;
  dataCompletamento?: string;
  downloadUrl?: string;
}

export default function ExportDatiPage() {
  const { toast } = useToast();
  const [_requestId, setRequestId] = useState<number | null>(null);

  // Carica richieste export
  const { data: richiesteExport, isLoading } = useQuery({
    queryKey: ["export-dati"],
    queryFn: async () => {
      const response = await api.get("/paziente/export-dati");
      return response.data;
    },
  });

  // Richiedi nuovo export
  const richiediExportMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get("/paziente/export-dati");
      return response.data;
    },
    onSuccess: (_data) => {
      toast({
        title: "Export richiesto",
        description: "La richiesta di export è stata creata. Riceverai una notifica quando sarà pronto.",
      });
      // Ricarica lista
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nella richiesta di export",
        variant: "destructive",
      });
    },
  });

  const handleRichiediExport = async () => {
    try {
      const response = await api.get("/paziente/export-dati");
      if (response.data?.id) {
        setRequestId(response.data.id);
        richiediExportMutation.mutate();
      }
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nella richiesta",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (requestId: number) => {
    try {
      const response = await api.get(`/paziente/export-dati/${requestId}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `export-dati-${requestId}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({
        title: "Download completato",
        description: "Il file di export è stato scaricato.",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Errore nel download del file",
        variant: "destructive",
      });
    }
  };

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case "IN_ELABORAZIONE":
        return (
          <Badge className="bg-blue-500">
            <Clock className="w-3 h-3 mr-1" />
            In Elaborazione
          </Badge>
        );
      case "PRONTO":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Pronto
          </Badge>
        );
      case "SCADUTO":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Scaduto
          </Badge>
        );
      default:
        return <Badge>{stato}</Badge>;
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const richieste: ExportRequest[] = richiesteExport || [];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Export Dati Personali</h1>
        <p className="text-gray-600 mt-2">
          Richiedi l&apos;export completo dei tuoi dati personali
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          L'export include tutti i tuoi dati personali: profilo, terapie, prescrizioni, ordini,
          messaggi, consensi e assunzioni. Il file sarà disponibile per 7 giorni dopo la generazione.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nuova Richiesta Export</CardTitle>
            <CardDescription>
              Richiedi un nuovo export dei tuoi dati. Il processo può richiedere alcuni minuti.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleRichiediExport}
              disabled={richiediExportMutation.isPending}
            >
              {richiediExportMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Elaborazione...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Richiedi Export
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {richieste.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Richieste Precedenti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {richieste.map((richiesta) => (
                  <div
                    key={richiesta.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <FileDown className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Export #{richiesta.id}</p>
                        <p className="text-sm text-gray-500">
                          Richiesto il {new Date(richiesta.dataRichiesta).toLocaleDateString("it-IT")}
                          {richiesta.dataCompletamento &&
                            ` • Completato il ${new Date(richiesta.dataCompletamento).toLocaleDateString("it-IT")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatoBadge(richiesta.stato)}
                      {richiesta.stato === "PRONTO" && (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(richiesta.id)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Scarica
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


