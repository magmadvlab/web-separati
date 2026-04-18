"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Save,
  Upload,
  User,
} from "lucide-react";

type TipoFileUpload = "pdf" | "immagine" | "dicom";

interface RefertoDettaglio {
  id: number;
  stato: string;
  note?: string | null;
  fileUrl?: string | null;
  createdAt: string;
  dataReferto?: string;
  paziente: {
    nome: string;
    cognome: string;
    codiceFiscale?: string;
    telefono?: string;
    emailPersonale?: string;
  };
  prenotazione: {
    id: number;
    codicePrenotazione?: string;
    dataOraAppuntamento?: string;
    servizio?: {
      nome?: string;
      categoria?: string;
    };
  };
}

const statoBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  bozza: { label: "Bozza", variant: "outline" },
  validato: { label: "Validato", variant: "default" },
  consegnato: { label: "Consegnato", variant: "secondary" },
  archiviato: { label: "Archiviato", variant: "secondary" },
};

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
  });

const resolveTipoFile = (file: File): TipoFileUpload | null => {
  const mime = file.type.toLowerCase();
  const lower = file.name.toLowerCase();

  if (mime === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (mime.startsWith("image/") || [".jpg", ".jpeg", ".png", ".webp"].some((ext) => lower.endsWith(ext))) {
    return "immagine";
  }
  if (mime.includes("dicom") || [".dcm", ".dicom"].some((ext) => lower.endsWith(ext))) {
    return "dicom";
  }

  return null;
};

export default function RefertoDettaglioPage() {
  const params = useParams();
  const refertoId = parseInt(params.id as string, 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [note, setNote] = useState("");
  const [descrizioneUpload, setDescrizioneUpload] = useState("");
  const [fileSelezionato, setFileSelezionato] = useState<File | null>(null);

  const { data: referto, isLoading } = useQuery<RefertoDettaglio>({
    queryKey: ["referto-laboratorio", refertoId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<RefertoDettaglio>>(`/laboratori/dashboard/referti/${refertoId}`);
      return res.data.data;
    },
    enabled: Number.isFinite(refertoId),
  });

  useEffect(() => {
    if (referto?.note !== undefined && referto?.note !== null) {
      setNote(referto.note);
    }
  }, [referto?.note]);

  const aggiornaRefertoMutation = useMutation({
    mutationFn: async (payload: { note?: string }) => {
      const res = await api.put<ApiResponse<RefertoDettaglio>>(
        `/laboratori/dashboard/referti/${refertoId}`,
        payload,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referto-laboratorio", refertoId] });
      queryClient.invalidateQueries({ queryKey: ["referti-laboratorio"] });
      toast({
        title: "Referto aggiornato",
        description: "Le modifiche sono state salvate correttamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.message || "Impossibile aggiornare il referto",
        variant: "destructive",
      });
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (payload: { tipoFile: TipoFileUpload; fileBase64: string; nomeFile: string; descrizione?: string }) => {
      const res = await api.post<ApiResponse<any>>(
        `/laboratori/dashboard/referti/${refertoId}/upload`,
        {
          refertoId,
          ...payload,
        },
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referto-laboratorio", refertoId] });
      queryClient.invalidateQueries({ queryKey: ["referti-laboratorio"] });
      setFileSelezionato(null);
      setDescrizioneUpload("");
      toast({
        title: "File caricato",
        description: "Allegato caricato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore upload",
        description: error?.response?.data?.message || "Impossibile caricare il file",
        variant: "destructive",
      });
    },
  });

  const validaRefertoMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<RefertoDettaglio>>(
        `/laboratori/dashboard/referti/${refertoId}/valida`,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referto-laboratorio", refertoId] });
      queryClient.invalidateQueries({ queryKey: ["referti-laboratorio"] });
      toast({
        title: "Referto validato",
        description: "Il referto è stato pubblicato correttamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore validazione",
        description: error?.response?.data?.message || "Impossibile validare il referto",
        variant: "destructive",
      });
    },
  });

  const handleSalvaNote = () => {
    aggiornaRefertoMutation.mutate({ note });
  };

  const handleUpload = async () => {
    if (!fileSelezionato) {
      toast({
        title: "Nessun file selezionato",
        description: "Seleziona un file PDF, immagine o DICOM",
        variant: "destructive",
      });
      return;
    }

    const tipoFile = resolveTipoFile(fileSelezionato);
    if (!tipoFile) {
      toast({
        title: "Formato non supportato",
        description: "Sono supportati PDF, immagini (JPG/PNG/WEBP) e DICOM",
        variant: "destructive",
      });
      return;
    }

    try {
      const fileBase64 = await toBase64(fileSelezionato);
      uploadFileMutation.mutate({
        tipoFile,
        fileBase64,
        nomeFile: fileSelezionato.name,
        descrizione: descrizioneUpload || undefined,
      });
    } catch {
      toast({
        title: "Errore file",
        description: "Impossibile leggere il file selezionato",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!referto) {
    return <NotFound message="Referto non trovato" />;
  }

  const badge = statoBadge[referto.stato] || { label: referto.stato, variant: "default" as const };
  const dataReferto = referto.dataReferto || referto.createdAt;
  const dataPrenotazione = referto.prenotazione?.dataOraAppuntamento;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/laboratorio/referti" className="flex items-center text-sm text-gray-500 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Torna ai referti
        </Link>
        <h1 className="text-2xl font-bold">Dettaglio Referto</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Referto #{referto.id}</span>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Paziente
            </h3>
            <p className="font-medium">{referto.paziente.nome} {referto.paziente.cognome}</p>
            {referto.paziente.codiceFiscale && <p>CF: {referto.paziente.codiceFiscale}</p>}
            {referto.paziente.telefono && <p>Tel: {referto.paziente.telefono}</p>}
            {referto.paziente.emailPersonale && <p>Email: {referto.paziente.emailPersonale}</p>}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Prenotazione
            </h3>
            <p>
              <span className="font-medium">ID:</span> {referto.prenotazione?.id}
            </p>
            {referto.prenotazione?.codicePrenotazione && (
              <p>
                <span className="font-medium">Codice:</span> {referto.prenotazione.codicePrenotazione}
              </p>
            )}
            {referto.prenotazione?.servizio?.nome && (
              <p>
                <span className="font-medium">Servizio:</span> {referto.prenotazione.servizio.nome}
              </p>
            )}
            <p>
              <span className="font-medium">Data referto:</span>{" "}
              {new Date(dataReferto).toLocaleString("it-IT")}
            </p>
            {dataPrenotazione && (
              <p>
                <span className="font-medium">Data appuntamento:</span>{" "}
                {new Date(dataPrenotazione).toLocaleString("it-IT")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Allegato Referto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {referto.fileUrl ? (
            <a
              href={`/api/pdf-view?url=${encodeURIComponent(referto.fileUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-blue-600 hover:underline text-sm"
            >
              Apri file caricato
            </a>
          ) : (
            <p className="text-sm text-gray-500">Nessun file caricato.</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="fileUpload">Carica documento (PDF / immagini / DICOM)</Label>
            <Input
              id="fileUpload"
              type="file"
              accept=".pdf,.dcm,.dicom,image/*"
              onChange={(e) => setFileSelezionato(e.target.files?.[0] ?? null)}
            />
            {fileSelezionato && (
              <p className="text-xs text-gray-500">
                Selezionato: {fileSelezionato.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descrizioneUpload">Descrizione file (opzionale)</Label>
            <Input
              id="descrizioneUpload"
              value={descrizioneUpload}
              onChange={(e) => setDescrizioneUpload(e.target.value)}
              placeholder="Es. radiografia torace, allegato referto completo"
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploadFileMutation.isPending}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploadFileMutation.isPending ? "Caricamento..." : "Carica Allegato"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Note Cliniche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            placeholder="Inserisci note aggiuntive per il referto"
          />
          <Button
            onClick={handleSalvaNote}
            disabled={aggiornaRefertoMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {aggiornaRefertoMutation.isPending ? "Salvataggio..." : "Salva Note"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pubblicazione</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => validaRefertoMutation.mutate()}
            disabled={validaRefertoMutation.isPending || referto.stato === "validato"}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {referto.stato === "validato"
              ? "Referto già validato"
              : validaRefertoMutation.isPending
                ? "Validazione..."
                : "Valida e Pubblica Referto"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
