"use client";

import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  Upload,
  Send,
  Loader2,
  FlaskConical,
  ScanLine,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface Prenotazione {
  id: number;
  codicePrenotazione: string;
  dataOraAppuntamento: string;
  stato: string;
  tipoPagamento: string;
  importoTotale?: number;
  notePaziente?: string;
  paziente: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale: string;
    telefono?: string;
    emailPersonale?: string;
    indirizzo: string;
    citta: string;
    cap: string;
    provincia: string;
  };
  servizio: {
    id: number;
    nome: string;
    tipoServizio: string;
  };
  prescrizioneAnalisi?: { id: number; tipo: string };
  referti?: { id: number; stato: string }[];
}

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

export default function DettaglioPrenotazioneLaboratorioPage() {
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prenotazioneId = parseInt(params.id as string);
  const [nuovoStato, setNuovoStato] = useState("");
  const [note, setNote] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [noteReferto, setNoteReferto] = useState("");
  const [step, setStep] = useState<"idle" | "uploading" | "done">("idle");
  const [modalitaReferto, setModalitaReferto] = useState<"parametri" | "pdf" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: prenotazione, isLoading, error } = useQuery<Prenotazione>({
    queryKey: ["prenotazione-laboratorio", prenotazioneId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prenotazione>>(
        `/laboratori/dashboard/prenotazioni/${prenotazioneId}`
      );
      return response.data.data;
    },
    enabled: !!prenotazioneId,
  });

  const aggiornaStatoMutation = useMutation({
    mutationFn: async ({ stato, note }: { stato: string; note?: string }) => {
      const response = await api.put<ApiResponse<Prenotazione>>(
        `/laboratori/dashboard/prenotazioni/${prenotazioneId}/stato`,
        { stato, note }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prenotazione-laboratorio", prenotazioneId] });
      queryClient.invalidateQueries({ queryKey: ["prenotazioni-laboratorio"] });
      setNuovoStato("");
      setNote("");
      toast({ title: "Stato aggiornato" });
    },
    onError: (error: any) => {
      toast({ title: "Errore", description: error?.response?.data?.error || "Errore aggiornamento", variant: "destructive" });
    },
  });

  // Flusso unificato: crea referto → upload PDF → valida → notifica paziente
  const caricaEInviaMutation = useMutation({
    mutationFn: async () => {
      if (!pdfFile) throw new Error("Nessun file selezionato");
      setStep("uploading");

      // 1. Crea il referto (legato alla prenotazione → paziente già noto)
      const creaRes = await api.post<ApiResponse<{ id: number }>>(
        "/laboratori/dashboard/referti",
        { prenotazioneId, note: noteReferto || undefined }
      );
      const refertoId = creaRes.data.data.id;

      // 2. Upload PDF (base64 → Cloudinary)
      const fileBase64 = await toBase64(pdfFile);
      await api.post(`/laboratori/dashboard/referti/${refertoId}/upload`, {
        tipoFile: "pdf",
        fileBase64,
        nomeFile: pdfFile.name,
      });

      // 3. Valida e notifica il paziente (notifica via email/push automatica)
      await api.post(`/laboratori/dashboard/referti/${refertoId}/valida`, {});

      return refertoId;
    },
    onSuccess: (refertoId) => {
      setStep("done");
      setPdfFile(null);
      setNoteReferto("");
      queryClient.invalidateQueries({ queryKey: ["prenotazione-laboratorio", prenotazioneId] });
      toast({
        title: "Referto inviato",
        description: "Il paziente ha ricevuto la notifica con il link al referto.",
      });
    },
    onError: (e: any) => {
      setStep("idle");
      toast({ title: "Errore invio referto", description: e?.response?.data?.message || e?.message, variant: "destructive" });
    },
  });

  if (isLoading) return <Loading />;
  if (error || !prenotazione) return <NotFound message="Prenotazione non trovata" />;

  const dataOra = new Date(prenotazione.dataOraAppuntamento);
  const statiBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    prenotata: { label: "Prenotata", variant: "default" },
    confermata: { label: "Confermata", variant: "secondary" },
    completata: { label: "Completata", variant: "secondary" },
    referto_in_preparazione: { label: "Referto in preparazione", variant: "outline" },
    referto_pronto: { label: "Referto pronto", variant: "default" },
    risultato_disponibile: { label: "Risultato Disponibile", variant: "default" },
    cancellata: { label: "Cancellata", variant: "destructive" },
  };
  const statoBadge = statiBadge[prenotazione.stato] || { label: prenotazione.stato, variant: "default" as const };

  const puoCaricareReferto = ["completata", "referto_in_preparazione"].includes(prenotazione.stato);
  const refertoGiaInviato = prenotazione.stato === "referto_pronto" || step === "done";

  // Auto-suggerimento modalità in base al tipo servizio (una volta sola quando i dati arrivano)
  useEffect(() => {
    if (!prenotazione?.servizio?.tipoServizio) return;
    const t = prenotazione.servizio.tipoServizio.toLowerCase();
    if (
      t.includes("sangue") || t.includes("urine") ||
      t.includes("analisi") || t.includes("chimica") || t.includes("microbiolog")
    ) {
      setModalitaReferto("parametri");
    } else if (
      t.includes("radio") || t.includes("tac") || t.includes("risonan") ||
      t.includes("eco") || t.includes("dicom") || t.includes("imaging")
    ) {
      setModalitaReferto("pdf");
    }
    // altrimenti resta null → l'operatore sceglie
  }, [prenotazione?.servizio?.tipoServizio]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/laboratorio/prenotazioni" className="flex items-center text-sm text-gray-500 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Torna alle prenotazioni
        </Link>
        <h1 className="text-2xl font-bold">Dettaglio Prenotazione</h1>
      </div>

      {/* Info paziente + appuntamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Codice: {prenotazione.codicePrenotazione}</span>
            <Badge variant={statoBadge.variant}>{statoBadge.label}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" /> Paziente
            </h3>
            <p className="font-medium">{prenotazione.paziente.nome} {prenotazione.paziente.cognome}</p>
            <p className="text-sm text-gray-500">CF: {prenotazione.paziente.codiceFiscale}</p>
            {prenotazione.paziente.emailPersonale && (
              <p className="text-sm text-gray-500">{prenotazione.paziente.emailPersonale}</p>
            )}
            {prenotazione.paziente.telefono && (
              <p className="text-sm text-gray-500">{prenotazione.paziente.telefono}</p>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" /> Appuntamento
            </h3>
            <div className="flex items-center gap-1 text-sm">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {dataOra.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {dataOra.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <p className="text-sm"><span className="font-medium">Servizio:</span> {prenotazione.servizio.nome}</p>
          </div>
        </CardContent>
      </Card>

      {/* Carica e invia referto — visibile quando il paziente ha fatto le analisi */}
      {refertoGiaInviato ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Referto inviato al paziente</p>
              <p className="text-sm text-green-700">Il paziente ha ricevuto la notifica con il link per scaricare il referto.</p>
            </div>
          </CardContent>
        </Card>
      ) : puoCaricareReferto ? (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <FileText className="h-5 w-5" />
              Invia referto al paziente
            </CardTitle>
            <p className="text-sm text-gray-500">
              Scegli come vuoi consegnare il referto. Puoi anche usare entrambe le modalità per lo stesso esame.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* Scelta modalità */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModalitaReferto("parametri")}
                className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                  modalitaReferto === "parametri"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                }`}
              >
                <FlaskConical className={`h-7 w-7 shrink-0 ${modalitaReferto === "parametri" ? "text-blue-600" : "text-gray-400"}`} />
                <div>
                  <p className="font-semibold text-sm">Parametri numerici</p>
                  <p className="text-xs text-gray-500">Emocromo, glicemia, colesterolo, urinocoltura…</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setModalitaReferto("pdf")}
                className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                  modalitaReferto === "pdf"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
                }`}
              >
                <ScanLine className={`h-7 w-7 shrink-0 ${modalitaReferto === "pdf" ? "text-blue-600" : "text-gray-400"}`} />
                <div>
                  <p className="font-semibold text-sm">Carica file</p>
                  <p className="text-xs text-gray-500">PDF, immagine, DICOM (radiologia, TAC, eco…)</p>
                </div>
              </button>
            </div>

            {/* Parametri numerici → rimanda alla pagina risultati */}
            {modalitaReferto === "parametri" && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-blue-800">Inserimento parametri</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Aggiungi i valori uno per uno (es. Glucosio 95 mg/dL). Il referto verrà generato e inviato al paziente.
                  </p>
                </div>
                <Link href={`/laboratorio/prenotazioni/${prenotazioneId}/risultati`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    Inserisci <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Upload file → PDF/immagine/DICOM */}
            {modalitaReferto === "pdf" && (
              <div className="space-y-3">
                <div
                  className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.dcm,.dicom,application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-2 text-blue-700">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">{pdfFile.name}</span>
                      <span className="text-xs text-gray-400">({(pdfFile.size / 1024).toFixed(0)} KB)</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-blue-300" />
                      <p className="font-medium">Clicca per selezionare il file</p>
                      <p className="text-xs mt-1">PDF, JPG, PNG, DICOM (.dcm)</p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="noteReferto">Note aggiuntive (opzionale)</label>
                  <Textarea
                    id="noteReferto"
                    placeholder="Es. Nella norma, nessuna anomalia rilevata…"
                    value={noteReferto}
                    onChange={(e) => setNoteReferto(e.target.value)}
                    className="h-20 resize-none"
                  />
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!pdfFile || caricaEInviaMutation.isPending}
                  onClick={() => caricaEInviaMutation.mutate()}
                >
                  {caricaEInviaMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {step === "uploading" ? "Caricamento in corso…" : "Invio in corso…"}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Carica e invia al paziente
                    </>
                  )}
                </Button>
              </div>
            )}

          </CardContent>
        </Card>
      ) : null}

      {/* Aggiorna stato */}
      <Card>
        <CardHeader>
          <CardTitle>Aggiorna Stato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={nuovoStato} onValueChange={setNuovoStato}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona nuovo stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="confermata">Confermata</SelectItem>
              <SelectItem value="completata">Completata — paziente ha effettuato le analisi</SelectItem>
              <SelectItem value="cancellata">Cancellata</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Note per il paziente (opzionale)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-20 resize-none"
          />
          <Button
            onClick={() => {
              if (!nuovoStato) return toast({ title: "Seleziona uno stato", variant: "destructive" });
              aggiornaStatoMutation.mutate({ stato: nuovoStato, note: note || undefined });
            }}
            disabled={aggiornaStatoMutation.isPending || !nuovoStato}
            variant="outline"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Aggiorna Stato
          </Button>
        </CardContent>
      </Card>

      {prenotazione.notePaziente && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" /> Note del Paziente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{prenotazione.notePaziente}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
