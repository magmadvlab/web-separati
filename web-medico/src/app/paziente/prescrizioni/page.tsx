"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Upload, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Prescrizione {
  id: number;
  codiceNre: string;
  dataEmissione: string;
  dataScadenza: string;
  stato: string;
  medico: {
    nome: string;
    cognome: string;
  };
  farmaci: Array<{
    nome: string;
    quantita: number;
  }>;
}

export default function PrescrizioniPage() {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [prescrizioni, setPrescrizioni] = useState<Prescrizione[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPrescrizioni();
  }, []);

  const fetchPrescrizioni = async () => {
    try {
      const response = await api.get("/paziente/prescrizioni");
      setPrescrizioni(response.data);
    } catch (error) {
      console.error("Errore caricamento prescrizioni:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (prescrizioneId: number, codiceNre: string) => {
    try {
      const response = await api.get(`/paziente/prescrizioni/${prescrizioneId}/pdf`, {
        responseType: 'blob',
      });

      // Crea URL blob e scarica
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescrizione_${codiceNre || prescrizioneId}.pdf`);
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
        description: "Impossibile scaricare il PDF. Potrebbe non essere ancora disponibile.",
        variant: "destructive",
      });
    }
  };

  const handleVisualizza = (prescrizioneId: number) => {
    // Apri modal o naviga a pagina dettaglio
    window.open(`/paziente/prescrizioni/${prescrizioneId}`, '_blank');
  };

  const handleUploadFoto = async (prescrizioneId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Valida tipo file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Errore",
        description: "Seleziona un'immagine (JPG, PNG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    // Valida dimensione (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Errore",
        description: "Il file è troppo grande (max 10MB)",
        variant: "destructive",
      });
      return;
    }

    setUploadingId(prescrizioneId);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/paziente/upload/prescrizione/foto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: "Foto caricata",
        description: "La foto della prescrizione è stata caricata con successo",
      });

      // Ricarica prescrizioni per aggiornare la lista
      fetchPrescrizioni();
    } catch (error) {
      console.error("Errore upload foto:", error);
      toast({
        title: "Errore",
        description: "Errore durante il caricamento della foto",
        variant: "destructive",
      });
    } finally {
      setUploadingId(null);
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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento prescrizioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Le Mie Prescrizioni</h1>
        <p className="text-gray-600 mt-2">
          Visualizza e gestisci le tue prescrizioni mediche
        </p>
      </div>

      {prescrizioni.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-center">
              Nessuna prescrizione disponibile
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {prescrizioni.map((prescrizione) => (
            <Card key={prescrizione.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Prescrizione #{prescrizione.codiceNre || prescrizione.id}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Dr. {prescrizione.medico?.nome || ""} {prescrizione.medico?.cognome || ""}
                    </p>
                  </div>
                  {getStatoBadge(prescrizione.stato)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Data Emissione</p>
                      <p className="font-medium">
                        {new Date(prescrizione.dataEmissione).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Data Scadenza</p>
                      <p className="font-medium">
                        {new Date(prescrizione.dataScadenza).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Farmaci prescritti:</p>
                    <ul className="space-y-1">
                      {(prescrizione.farmaci || []).map((farmaco, index) => (
                        <li key={index} className="text-sm">
                          • {farmaco.nome || "Farmaco"} - Quantità: {farmaco.quantita || 0}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVisualizza(prescrizione.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizza
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadPDF(prescrizione.id, prescrizione.codiceNre)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Scarica PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={uploadingId === prescrizione.id}
                      onClick={() => document.getElementById(`upload-foto-${prescrizione.id}`)?.click()}
                    >
                      {uploadingId === prescrizione.id ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-spin" />
                          Caricamento...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Allega Foto
                        </>
                      )}
                    </Button>
                    <input
                      id={`upload-foto-${prescrizione.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadFoto(prescrizione.id, e)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
