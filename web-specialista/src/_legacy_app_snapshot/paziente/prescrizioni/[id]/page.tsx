"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, ArrowLeft, Calendar, User, Pill } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/shared/Loading";

interface Prescrizione {
  id: number;
  codiceNre: string;
  dataEmissione: string;
  dataScadenza: string;
  stato: string;
  medico: {
    nome: string;
    cognome: string;
    specializzazione?: string;
  };
  farmaci: Array<{
    nome: string;
    quantita: number;
    posologia?: string;
  }>;
  note?: string;
  fotoUrl?: string;
}

export default function DettaglioPrescrizione() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [prescrizione, setPrescrizione] = useState<Prescrizione | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescrizione();
  }, [params.id]);

  const fetchPrescrizione = async () => {
    try {
      const response = await api.get(`/paziente/prescrizioni/${params.id}`);
      setPrescrizione(response.data.data || response.data);
    } catch (error) {
      console.error("Errore caricamento prescrizione:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare la prescrizione",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!prescrizione) return;

    try {
      const response = await api.get(`/paziente/prescrizioni/${prescrizione.id}/pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescrizione_${prescrizione.codiceNre || prescrizione.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF scaricato",
        description: "Il PDF della prescrizione è stato scaricato",
      });
    } catch (error) {
      console.error("Errore download PDF:", error);
      toast({
        title: "Errore",
        description: "Impossibile scaricare il PDF",
        variant: "destructive",
      });
    }
  };

  const getStatoBadge = (stato: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      attiva: "default",
      utilizzata: "secondary",
      scaduta: "destructive",
    };
    return <Badge variant={variants[stato] || "outline"}>{stato}</Badge>;
  };

  if (loading) {
    return <Loading />;
  }

  if (!prescrizione) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600">Prescrizione non trovata</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna indietro
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Dettaglio Prescrizione</h1>
          <p className="text-gray-600 mt-1">
            Prescrizione #{prescrizione.codiceNre || prescrizione.id}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">Informazioni Prescrizione</CardTitle>
            {getStatoBadge(prescrizione.stato)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Medico */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <User className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600">Medico Prescrittore</p>
              <p className="font-medium">
                Dr. {prescrizione.medico?.nome} {prescrizione.medico?.cognome}
              </p>
              {prescrizione.medico?.specializzazione && (
                <p className="text-sm text-gray-600">{prescrizione.medico.specializzazione}</p>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Data Emissione</p>
                <p className="font-medium">
                  {new Date(prescrizione.dataEmissione).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Data Scadenza</p>
                <p className="font-medium">
                  {new Date(prescrizione.dataScadenza).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Farmaci */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Pill className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-lg">Farmaci Prescritti</h3>
            </div>
            <div className="space-y-3">
              {prescrizione.farmaci.map((farmaco, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{farmaco.nome}</p>
                      {farmaco.posologia && (
                        <p className="text-sm text-gray-600 mt-1">{farmaco.posologia}</p>
                      )}
                    </div>
                    <Badge variant="outline">Quantità: {farmaco.quantita}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          {prescrizione.note && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Note</p>
              <p className="text-sm">{prescrizione.note}</p>
            </div>
          )}

          {/* Foto allegata */}
          {prescrizione.fotoUrl && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Foto Prescrizione</p>
              <img 
                src={prescrizione.fotoUrl} 
                alt="Prescrizione" 
                className="max-w-full h-auto rounded-lg border"
              />
            </div>
          )}

          {/* Azioni */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleDownloadPDF} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Scarica PDF
            </Button>
            <Button variant="outline" onClick={() => router.push('/paziente/ordini/nuovo')}>
              Ordina Farmaci
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
