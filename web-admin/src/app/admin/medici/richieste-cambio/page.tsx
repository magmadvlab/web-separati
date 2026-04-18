"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ArrowRightLeft,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface RichiestaCambio {
  id: number;
  stato: "in_attesa" | "approvata" | "rifiutata";
  motivo?: string;
  noteAdmin?: string;
  tipoRichiesta?: string;
  fuoriAmbito?: boolean;
  motivoDerogaCodice?: string | null;
  motivoDerogaDettaglio?: string | null;
  medicoAccettaDeroga?: boolean | null;
  dataAccettazioneMedico?: string | null;
  dataScadenzaValutazione?: string | null;
  canaleRichiesta?: string;
  dataRichiesta: string;
  dataDecisione?: string;
  paziente: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale?: string;
    citta?: string;
    medicoCurante?: {
      id: number;
      nome: string;
      cognome: string;
      citta?: string;
    } | null;
  };
  medicoRichiesto: {
    id: number;
    nome: string;
    cognome: string;
    specializzazione?: string;
    citta?: string;
  };
  admin?: {
    id: number;
    username: string;
  } | null;
}

interface MedicoCandidato {
  id: number;
  nome: string;
  cognome: string;
  codiceRegionale?: string;
  specializzazione?: string;
  citta?: string;
  assistitiAttivi?: number;
  massimaleAssistiti?: number;
  postiDisponibili?: number;
  stessoAmbitoTerritoriale?: boolean;
  richiedeDerogaTerritoriale?: boolean;
  _count?: {
    pazienti: number;
  };
}

function formatDateIt(value?: string | null, withYear = true) {
  if (!value) return "n/d";
  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function getTipoRichiestaLabel(tipo?: string) {
  return tipo === "deroga_territoriale" ? "Deroga territoriale" : "Ordinaria";
}

function getCanaleRichiestaLabel(canale?: string) {
  switch (canale) {
    case "sportello":
      return "Sportello";
    case "pec":
      return "PEC";
    case "admin":
      return "Admin";
    default:
      return "Online";
  }
}

function getMotivoDerogaLabel(codice?: string | null) {
  switch (codice) {
    case "continuita_terapeutica":
      return "Continuità terapeutica";
    case "medico_familiare_convivente":
      return "Medico del familiare convivente";
    case "viabilita_accessibilita":
      return "Viabilità / accessibilità";
    case "carenza_ambito_residenza":
      return "Carenza medici in ambito";
    case "assistenza_obbligata":
      return "Assistenza obbligata";
    case "altro":
      return "Altro";
    default:
      return "Non specificato";
  }
}

function getScadenzaMeta(dataScadenza?: string | null) {
  if (!dataScadenza) return null;
  const target = new Date(dataScadenza);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  return {
    diffDays,
    isExpired: diffDays < 0,
    isUrgent: diffDays >= 0 && diffDays <= 3,
    label: diffDays < 0 ? `Scaduta da ${Math.abs(diffDays)} giorni` : `Scade tra ${diffDays} giorni`,
  };
}

function StatoBadge({ stato }: { stato: string }) {
  switch (stato) {
    case "in_attesa":
      return (
        <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 border border-amber-200 text-xs font-semibold px-2.5 py-1 rounded-full">
          <Clock className="h-3 w-3" /> In attesa
        </span>
      );
    case "approvata":
      return (
        <span className="inline-flex items-center gap-1 text-green-800 bg-green-100 border border-green-200 text-xs font-semibold px-2.5 py-1 rounded-full">
          <CheckCircle className="h-3 w-3" /> Approvata
        </span>
      );
    case "rifiutata":
      return (
        <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 border border-red-200 text-xs font-semibold px-2.5 py-1 rounded-full">
          <XCircle className="h-3 w-3" /> Rifiutata
        </span>
      );
    default:
      return null;
  }
}

export default function AdminRichiesteCambioMedicoPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [filtroStato, setFiltroStato] = useState<string>("in_attesa");
  const [dialogRichiesta, setDialogRichiesta] = useState<RichiestaCambio | null>(null);
  const [azione, setAzione] = useState<"approvata" | "rifiutata">("approvata");
  const [noteAdmin, setNoteAdmin] = useState("");
  const [medicoRichiestoId, setMedicoRichiestoId] = useState<string>("");

  // Fetch richieste
  const { data: richieste = [], isLoading } = useQuery<RichiestaCambio[]>({
    queryKey: ["admin-richieste-cambio-medico", filtroStato],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtroStato && filtroStato !== "tutte") params.set("stato", filtroStato);
      const res = await api.get(`/admin/richieste-cambio-medico?${params}`);
      return res.data?.data ?? res.data ?? [];
    },
  });

  const { data: mediciCandidati = [], isLoading: loadingMediciCandidati } = useQuery<MedicoCandidato[]>({
    queryKey: ["admin-richieste-cambio-medico-candidati", dialogRichiesta?.id],
    enabled: !!dialogRichiesta && azione === "approvata",
    queryFn: async () => {
      if (!dialogRichiesta) return [];
      const res = await api.get(`/admin/richieste-cambio-medico/${dialogRichiesta.id}/medici-candidati`);
      return res.data?.data ?? res.data ?? [];
    },
  });

  // Mutation: decide richiesta
  const decideMutation = useMutation({
    mutationFn: async ({
      id,
      stato,
      note,
      medicoId,
    }: {
      id: number;
      stato: "approvata" | "rifiutata";
      note?: string;
      medicoId?: number;
    }) =>
      api.put(`/admin/richieste-cambio-medico/${id}`, {
        stato,
        noteAdmin: note,
        medicoRichiestoId: medicoId,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-richieste-cambio-medico"] });
      toast({
        title: vars.stato === "approvata" ? "Cambio medico approvato ✅" : "Richiesta rifiutata",
        description:
          vars.stato === "approvata"
            ? "Il medico curante del paziente è stato aggiornato e le visite pendenti con il vecchio medico sono state annullate."
            : "Il paziente è stato notificato del rifiuto.",
      });
      setDialogRichiesta(null);
      setNoteAdmin("");
      setMedicoRichiestoId("");
    },
    onError: (err: any) => {
      toast({
        title: "Errore",
        description: err.response?.data?.message || "Impossibile processare la richiesta.",
        variant: "destructive",
      });
    },
  });

  function openDialog(r: RichiestaCambio, a: "approvata" | "rifiutata") {
    setDialogRichiesta(r);
    setAzione(a);
    setNoteAdmin("");
    setMedicoRichiestoId(r.medicoRichiesto?.id ? String(r.medicoRichiesto.id) : "");
  }

  useEffect(() => {
    if (!dialogRichiesta) {
      setMedicoRichiestoId("");
      return;
    }
    setMedicoRichiestoId(dialogRichiesta.medicoRichiesto?.id ? String(dialogRichiesta.medicoRichiesto.id) : "");
  }, [dialogRichiesta]);

  function handleDecide() {
    if (!dialogRichiesta) return;
    if (azione === "approvata" && !medicoRichiestoId) {
      toast({
        title: "Seleziona il nuovo medico",
        description: "Per approvare devi indicare il medico da assegnare.",
        variant: "destructive",
      });
      return;
    }
    if (azione === "rifiutata" && !noteAdmin.trim()) {
      toast({ title: "Note obbligatorie", description: "Inserisci una motivazione per il rifiuto.", variant: "destructive" });
      return;
    }
    decideMutation.mutate({
      id: dialogRichiesta.id,
      stato: azione,
      note: noteAdmin || undefined,
      medicoId: azione === "approvata" ? Number(medicoRichiestoId) : undefined,
    });
  }

  const inAttesaCount = richieste.filter((r) => r.stato === "in_attesa").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-7 w-7 text-violet-600" />
            Richieste Cambio Medico
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestisci le richieste dei pazienti di cambiare medico di famiglia.
          </p>
        </div>
        {filtroStato === "in_attesa" && inAttesaCount > 0 && (
          <div className="px-3 py-1.5 bg-amber-100 border border-amber-200 rounded-lg text-sm font-semibold text-amber-800">
            {inAttesaCount} {inAttesaCount === 1 ? "richiesta in attesa" : "richieste in attesa"}
          </div>
        )}
      </div>

      {/* Filtro */}
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium whitespace-nowrap">Filtra per stato:</Label>
        <Select value={filtroStato} onValueChange={setFiltroStato}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="in_attesa">In attesa</SelectItem>
            <SelectItem value="approvata">Approvate</SelectItem>
            <SelectItem value="rifiutata">Rifiutate</SelectItem>
            <SelectItem value="tutte">Tutte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista richieste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : richieste.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ArrowRightLeft className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">
              Nessuna richiesta{filtroStato !== "tutte" ? ` con stato "${filtroStato}"` : ""}.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {richieste.map((r) => {
            const scadenzaMeta = getScadenzaMeta(r.dataScadenzaValutazione);
            return (
            <Card key={r.id} className={r.stato === "in_attesa" ? "border-amber-200" : ""}>
              <CardContent className="pt-5 pb-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Info sinistra */}
                  <div className="space-y-3 flex-1">
                    {/* Header riga: stato + data */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <StatoBadge stato={r.stato} />
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border bg-gray-100 text-gray-800 border-gray-200">
                        {getTipoRichiestaLabel(r.tipoRichiesta)}
                      </span>
                      {r.fuoriAmbito && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border bg-rose-50 text-rose-700 border-rose-200">
                          Fuori ambito
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Richiesta il {formatDateIt(r.dataRichiesta)}
                      </span>
                      {r.dataDecisione && (
                        <span className="text-xs text-muted-foreground">
                          · Decisa il {formatDateIt(r.dataDecisione)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        · Canale {getCanaleRichiestaLabel(r.canaleRichiesta)}
                      </span>
                    </div>

                    {scadenzaMeta && (
                      <div
                        className={`text-xs p-2 rounded border ${
                          scadenzaMeta.isExpired
                            ? "bg-red-50 border-red-200 text-red-700"
                            : scadenzaMeta.isUrgent
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}
                      >
                        Valutazione amministrativa: {scadenzaMeta.label} (entro il{" "}
                        {formatDateIt(r.dataScadenzaValutazione)})
                      </div>
                    )}

                    {/* Paziente */}
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">
                          {r.paziente.nome} {r.paziente.cognome}
                          {r.paziente.codiceFiscale && (
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                              CF: {r.paziente.codiceFiscale}
                            </span>
                          )}
                        </p>
                        {r.paziente.citta && (
                          <p className="text-xs text-muted-foreground">{r.paziente.citta}</p>
                        )}
                      </div>
                    </div>

                    {/* Cambio medico: vecchio → nuovo */}
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Medico attuale</p>
                        <p className="font-medium text-sm">
                          {r.paziente.medicoCurante
                            ? `Dr. ${r.paziente.medicoCurante.nome} ${r.paziente.medicoCurante.cognome}`
                            : <span className="text-muted-foreground">Nessuno</span>}
                        </p>
                        {r.paziente.medicoCurante?.citta && (
                          <p className="text-xs text-muted-foreground">{r.paziente.medicoCurante.citta}</p>
                        )}
                      </div>
                      <ArrowRightLeft className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <div className="px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Nuovo medico richiesto</p>
                        <p className="font-semibold text-sm text-violet-800">
                          Dr. {r.medicoRichiesto.nome} {r.medicoRichiesto.cognome}
                        </p>
                        {r.medicoRichiesto.citta && (
                          <p className="text-xs text-muted-foreground">{r.medicoRichiesto.citta}</p>
                        )}
                      </div>
                    </div>

                    {/* Motivo paziente */}
                    {r.motivo && (
                      <div className="flex gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-blue-800">Motivo paziente: </span>
                          <span className="text-blue-700">{r.motivo}</span>
                        </div>
                      </div>
                    )}

                    {r.fuoriAmbito && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
                        <p className="font-medium">Deroga territoriale</p>
                        <p className="text-xs mt-1">
                          Motivo codificato: {getMotivoDerogaLabel(r.motivoDerogaCodice)}
                        </p>
                        {r.motivoDerogaDettaglio && (
                          <p className="text-xs mt-1">Dettaglio: {r.motivoDerogaDettaglio}</p>
                        )}
                        {r.medicoAccettaDeroga !== null && r.medicoAccettaDeroga !== undefined && (
                          <p className="text-xs mt-1">
                            Accettazione medico:{" "}
                            {r.medicoAccettaDeroga ? "confermata" : "non confermata"}
                            {r.dataAccettazioneMedico ? ` il ${formatDateIt(r.dataAccettazioneMedico)}` : ""}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Nota admin (se esiste già) */}
                    {r.noteAdmin && (
                      <div className="p-2.5 bg-gray-50 border rounded-lg text-xs">
                        <span className="font-medium">Nota admin: </span>
                        {r.noteAdmin}
                        {r.admin && (
                          <span className="text-muted-foreground ml-1">
                            (da {r.admin.username})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottoni azione */}
                  {r.stato === "in_attesa" && (
                    <div className="flex flex-col gap-2 md:flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => openDialog(r, "approvata")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approva
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => openDialog(r, "rifiutata")}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rifiuta
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )})}
        </div>
      )}

      {/* Dialog conferma */}
      <Dialog open={dialogRichiesta !== null} onOpenChange={(o) => { if (!o) { setDialogRichiesta(null); setNoteAdmin(""); setMedicoRichiestoId(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={azione === "approvata" ? "text-green-700" : "text-red-700"}>
              {azione === "approvata" ? "✅ Approva cambio medico" : "❌ Rifiuta richiesta"}
            </DialogTitle>
            <DialogDescription>
              {dialogRichiesta && (
                <>
                  Paziente:{" "}
                  <strong>
                    {dialogRichiesta.paziente.nome} {dialogRichiesta.paziente.cognome}
                  </strong>
                  <br />
                  Nuovo medico richiesto:{" "}
                  <strong>
                    Dr. {dialogRichiesta.medicoRichiesto.nome}{" "}
                    {dialogRichiesta.medicoRichiesto.cognome}
                  </strong>
                  <br />
                  Tipo richiesta:{" "}
                  <strong>{getTipoRichiestaLabel(dialogRichiesta.tipoRichiesta)}</strong>
                  {dialogRichiesta.fuoriAmbito && (
                    <>
                      <br />
                      <span className="text-rose-700">
                        Deroga territoriale ({getMotivoDerogaLabel(dialogRichiesta.motivoDerogaCodice)})
                      </span>
                    </>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {azione === "approvata" && (
            <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Effetti dell&apos;approvazione:</p>
                <ul className="mt-1 list-disc list-inside space-y-0.5">
                  <li>Il medico curante del paziente cambierà immediatamente</li>
                  <li>Le richieste di visita <em>pendenti</em> con il vecchio medico saranno annullate</li>
                  <li>Le visite già confermate rimarranno invariate</li>
                  <li>La documentazione clinica sarà visibile al nuovo medico</li>
                </ul>
              </div>
            </div>
          )}

          {azione === "approvata" && (
            <div className="space-y-1.5">
              <Label htmlFor="medicoRichiestoId">Medico da assegnare *</Label>
              <Select value={medicoRichiestoId} onValueChange={setMedicoRichiestoId}>
                <SelectTrigger id="medicoRichiestoId">
                  <SelectValue placeholder="Seleziona un medico" />
                </SelectTrigger>
                <SelectContent>
                  {loadingMediciCandidati ? (
                    <SelectItem value="__loading" disabled>
                      Caricamento medici...
                    </SelectItem>
                  ) : (
                    mediciCandidati.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        Dr. {m.nome} {m.cognome}
                        {m.citta ? ` (${m.citta})` : ""}
                        {typeof m.postiDisponibili === "number" && typeof m.massimaleAssistiti === "number"
                          ? ` · ${m.postiDisponibili}/${m.massimaleAssistiti} posti`
                          : ""}
                        {m.richiedeDerogaTerritoriale ? " · fuori ambito" : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {dialogRichiesta?.paziente.medicoCurante?.id === dialogRichiesta?.medicoRichiesto?.id && (
                <p className="text-xs text-amber-700">
                  La richiesta legacy non indica un nuovo medico valido: selezionane uno prima di approvare.
                </p>
              )}
            </div>
          )}

          {azione === "approvata" && dialogRichiesta?.fuoriAmbito && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
              Approvando questa richiesta stai confermando un cambio fuori ambito (deroga territoriale).
              Verifica che la motivazione sia completa e coerente con i criteri SSN.
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="noteAdmin">
              {azione === "rifiutata" ? "Motivazione del rifiuto *" : "Nota per il paziente (opzionale)"}
            </Label>
            <Textarea
              id="noteAdmin"
              rows={3}
              placeholder={
                azione === "approvata"
                  ? "Es: Cambio approvato, hai già completato la procedura ASL..."
                  : "Es: Non abbiamo trovato conferma del cambio sul portale ASL..."
              }
              value={noteAdmin}
              onChange={(e) => setNoteAdmin(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setDialogRichiesta(null); setNoteAdmin(""); }}>
              Annulla
            </Button>
            <Button
              onClick={handleDecide}
              disabled={decideMutation.isPending}
              className={azione === "approvata" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {decideMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : azione === "approvata" ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Conferma {azione === "approvata" ? "approvazione" : "rifiuto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
