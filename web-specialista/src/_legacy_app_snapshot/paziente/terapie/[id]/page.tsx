"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse, Terapia } from "@/types/api";
import { 
  ArrowLeft, 
  Pill, 
  FileText, 
  Calendar, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Camera,
  RefreshCw,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProgressiTerapiaCard } from "@/components/paziente/ProgressiTerapiaCard";
import { useState } from "react";

export default function DettaglioTerapiaPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const terapiaId = parseInt(params.id as string, 10);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const { data: terapia, isLoading } = useQuery<Terapia>({
    queryKey: ["paziente-terapia", terapiaId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Terapia>>(`/paziente/terapie/${terapiaId}`);
      return response.data.data;
    },
    enabled: !!terapiaId,
  });

  const richiestaRinnovoMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<any>>(
        `/paziente/richieste-rinnovo`,
        { terapiaId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-terapia", terapiaId] });
      queryClient.invalidateQueries({ queryKey: ["paziente-terapie-reminder"] });
      toast({
        title: "Richiesta inviata",
        description: "La richiesta di rinnovo è stata inviata al medico",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'invio della richiesta",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!terapia) {
    return (
      <div className="space-y-6">
        <Link href="/paziente/terapie">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle terapie
          </Button>
        </Link>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Terapia non trovata</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatoBadge = (stato?: string) => {
    switch (stato) {
      case 'critical':
        return (
          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Critico
          </span>
        );
      case 'warning':
        return (
          <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Attenzione
          </span>
        );
      case 'ok':
        return (
          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
            <CheckCircle2 className="h-3 w-3 inline mr-1" />
            OK
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/paziente/terapie">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle terapie
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dettaglio Terapia</h1>
            <p className="text-gray-600 mt-1">
              {terapia.farmaco?.nomeCommerciale || "Terapia"}
            </p>
          </div>
        </div>
        {terapia.richiestaRinnovoInCorso && (
          <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded">
            Richiesta rinnovo in corso
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informazioni Farmaco */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-blue-600" />
                Farmaco
              </CardTitle>
              {terapia.farmaco?.ricettaRichiesta ? (
                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                  <FileText className="h-3 w-3 inline mr-1" />
                  Richiede Ricetta
                </span>
              ) : (
                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                  OTC
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Nome Commerciale</p>
              <p className="text-lg font-semibold">{terapia.farmaco?.nomeCommerciale || "N/A"}</p>
            </div>
            {terapia.farmaco?.principioAttivo && (
              <div>
                <p className="text-sm font-medium text-gray-500">Principio Attivo</p>
                <p className="text-sm">{terapia.farmaco.principioAttivo}</p>
              </div>
            )}
            {terapia.farmaco?.dosaggio && (
              <div>
                <p className="text-sm font-medium text-gray-500">Dosaggio</p>
                <p className="text-sm">{terapia.farmaco.dosaggio}</p>
              </div>
            )}
            {terapia.farmaco?.formaFarmaceutica && (
              <div>
                <p className="text-sm font-medium text-gray-500">Forma Farmaceutica</p>
                <p className="text-sm">{terapia.farmaco.formaFarmaceutica}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informazioni Terapia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Dettagli Terapia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Posologia</p>
              <p className="text-sm">{terapia.posologia}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Dose Giornaliera</p>
              <p className="text-sm">{terapia.doseGiornaliera} compresse/giorno</p>
            </div>
            {terapia.orariAssunzione && terapia.orariAssunzione.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Orari Assunzione</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {terapia.orariAssunzione.map((orario, index) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1"
                    >
                      <Clock className="h-3 w-3" />
                      {orario}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {terapia.conPasto && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Assunzione con pasto</span>
              </div>
            )}
            {terapia.note && (
              <div>
                <p className="text-sm font-medium text-gray-500">Note</p>
                <p className="text-sm text-gray-600">{terapia.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quantità e Reminder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Stato e Quantità
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {terapia.giorniRimanenti !== undefined && (
              <div>
                <p className="text-sm font-medium text-gray-500">Giorni Rimanenti</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-2xl font-bold ${
                    terapia.statoReminder === 'critical' ? 'text-red-600' :
                    terapia.statoReminder === 'warning' ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    {terapia.giorniRimanenti}
                  </p>
                  {getStatoBadge(terapia.statoReminder)}
                </div>
              </div>
            )}
            {terapia.quantitaRimanente !== undefined && (
              <div>
                <p className="text-sm font-medium text-gray-500">Compresse Rimanenti</p>
                <p className="text-lg font-semibold">{terapia.quantitaRimanente}</p>
                {terapia.quantitaTotale && (
                  <p className="text-xs text-gray-500">
                    di {terapia.quantitaTotale} totali
                  </p>
                )}
              </div>
            )}
            {terapia.numeroScatole && terapia.compressePerScatola && (
              <div>
                <p className="text-sm font-medium text-gray-500">Confezione</p>
                <p className="text-sm">
                  {terapia.numeroScatole} scatola{terapia.numeroScatole !== 1 ? 'e' : ''} × {terapia.compressePerScatola} compresse
                </p>
              </div>
            )}
            {terapia.messaggioReminder && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">{terapia.messaggioReminder}</p>
              </div>
            )}
            {terapia.richiestaRinnovoInCorso && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  Richiesta rinnovo inviata al medico
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Il medico è stato notificato e gestirà la tua richiesta.
                </p>
              </div>
            )}
            {terapia.azioneRichiesta && !terapia.richiestaRinnovoInCorso && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Azione Richiesta: {terapia.azioneRichiesta === 'rinnovo' ? 'Richiedi Rinnovo' : 'Ritira Farmaco'}
                </p>
                {terapia.azioneRichiesta === 'rinnovo' && (
                  <Button
                    size="sm"
                    onClick={() => richiestaRinnovoMutation.mutate()}
                    disabled={richiestaRinnovoMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {richiestaRinnovoMutation.isPending ? "Invio..." : "Richiedi Rinnovo"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progressi Terapia */}
        {terapia.quantitaTotale && terapia.quantitaTotale > 0 && (
          <ProgressiTerapiaCard terapia={terapia} />
        )}

        {/* Foto Talloncino */}
        {terapia.fotoTalloncinoUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Foto Talloncino
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-64 rounded-lg overflow-hidden border">
                <Image
                  src={terapia.fotoTalloncinoUrl.startsWith('http') 
                    ? terapia.fotoTalloncinoUrl 
                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010'}${terapia.fotoTalloncinoUrl}`
                  }
                  alt="Talloncino scatola farmaco"
                  fill
                  className="object-contain"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Date */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Date
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Data Inizio</p>
              <p className="text-sm">
                {new Date(terapia.dataInizio).toLocaleDateString('it-IT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            {terapia.dataFine && (
              <div>
                <p className="text-sm font-medium text-gray-500">Data Fine Prevista</p>
                <p className="text-sm">
                  {new Date(terapia.dataFine).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
            {terapia.durataGiorni && (
              <div>
                <p className="text-sm font-medium text-gray-500">Durata</p>
                <p className="text-sm">{terapia.durataGiorni} giorni</p>
              </div>
            )}
            {terapia.prossimoRinnovo && (
              <div>
                <p className="text-sm font-medium text-gray-500">Prossimo Rinnovo</p>
                <p className="text-sm">
                  {new Date(terapia.prossimoRinnovo).toLocaleDateString('it-IT', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Documenti */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Documenti Allegati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Carica documenti relativi a questa terapia (prescrizioni, referti, note mediche)
            </p>
            
            <div>
              <input
                id={`upload-doc-terapia-${terapiaId}`}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // Valida tipo file
                  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
                  if (!allowedTypes.includes(file.type)) {
                    toast({
                      title: "Errore",
                      description: "Tipo di file non supportato. Usa JPG, PNG, WEBP o PDF",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Valida dimensione (max 20MB)
                  if (file.size > 20 * 1024 * 1024) {
                    toast({
                      title: "Errore",
                      description: "Il file è troppo grande (max 20MB)",
                      variant: "destructive",
                    });
                    return;
                  }

                  setUploadingDoc(true);

                  try {
                    const formData = new FormData();
                    formData.append('file', file);

                    const response = await api.post('/paziente/upload/terapia/documento', formData, {
                      headers: {
                        'Content-Type': 'multipart/form-data',
                      },
                    });

                    toast({
                      title: "Documento caricato",
                      description: "Il documento è stato allegato alla terapia",
                    });

                    // Ricarica terapia
                    queryClient.invalidateQueries({ queryKey: ["paziente-terapia", terapiaId] });
                  } catch (error) {
                    console.error("Errore upload documento:", error);
                    toast({
                      title: "Errore",
                      description: "Errore durante il caricamento del documento",
                      variant: "destructive",
                    });
                  } finally {
                    setUploadingDoc(false);
                  }
                }}
              />
              <Button
                variant="outline"
                className="w-full"
                disabled={uploadingDoc}
                onClick={() => document.getElementById(`upload-doc-terapia-${terapiaId}`)?.click()}
              >
                {uploadingDoc ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Carica Documento
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Formati supportati: JPG, PNG, WEBP, PDF</p>
              <p>• Dimensione massima: 20MB</p>
              <p>• I documenti saranno visibili solo a te e al tuo medico</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
