"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle,
  Loader2,
  Search,
  Shield,
  User,
  UserCog,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface Paziente {
  id: number;
  nome: string;
  cognome: string;
  codiceFiscale?: string;
  email?: string;
  citta?: string;
  provincia?: string;
  medicoCuranteId?: number | null;
  medicoCurante?: {
    id: number;
    nome: string;
    cognome: string;
    codiceRegionale?: string;
    citta?: string;
  } | null;
}

interface MedicoCandidato {
  id: number;
  nome: string;
  cognome: string;
  codiceRegionale?: string;
  specializzazione?: string;
  citta?: string;
  email?: string;
  _count?: { pazienti: number };
}

export default function CambioMedicoDirettoPage() {
  const { toast } = useToast();

  // State
  const [searchPaziente, setSearchPaziente] = useState("");
  const [searchMedico, setSearchMedico] = useState("");
  const [selectedPaziente, setSelectedPaziente] = useState<Paziente | null>(null);
  const [selectedMedico, setSelectedMedico] = useState<MedicoCandidato | null>(null);
  const [motivazione, setMotivazione] = useState("");
  const [noteInterne, setNoteInterne] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Query pazienti
  const {
    data: pazientiData,
    isLoading: loadingPazienti,
  } = useQuery({
    queryKey: ["admin-cambio-pazienti", searchPaziente],
    queryFn: async () => {
      if (!searchPaziente.trim() || searchPaziente.trim().length < 2) return null;
      const res = await api.get("/admin/cambio-medico-diretto/pazienti", {
        params: { search: searchPaziente, limit: 10 },
      });
      return res.data;
    },
    enabled: searchPaziente.trim().length >= 2,
  });

  // Query medici candidati
  const {
    data: mediciData,
    isLoading: loadingMedici,
  } = useQuery({
    queryKey: [
      "admin-cambio-medici",
      searchMedico,
      selectedPaziente?.citta,
      selectedPaziente?.medicoCuranteId,
    ],
    queryFn: async () => {
      const res = await api.get("/admin/cambio-medico-diretto/medici-candidati", {
        params: {
          search: searchMedico || undefined,
          citta: selectedPaziente?.citta || undefined,
          excludeMedicoId: selectedPaziente?.medicoCuranteId || undefined,
        },
      });
      return res.data;
    },
    enabled: !!selectedPaziente,
  });

  // Mutation cambio diretto
  const cambioMutation = useMutation({
    mutationFn: async (data: {
      pazienteId: number;
      nuovoMedicoId: number;
      motivazione: string;
      noteInterne?: string;
    }) => {
      const res = await api.post("/admin/cambio-medico-diretto", data);
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setShowConfirmDialog(false);
      toast({
        title: "Cambio medico eseguito",
        description: `${data.paziente.nome} ${data.paziente.cognome} → Dr. ${data.nuovoMedico.nome}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore",
        description: error.response?.data?.message || "Errore durante il cambio medico",
      });
    },
  });

  const handleConfirmChange = useCallback(() => {
    if (!selectedPaziente || !selectedMedico || !motivazione.trim()) return;
    cambioMutation.mutate({
      pazienteId: selectedPaziente.id,
      nuovoMedicoId: selectedMedico.id,
      motivazione: motivazione.trim(),
      noteInterne: noteInterne.trim() || undefined,
    });
  }, [selectedPaziente, selectedMedico, motivazione, noteInterne, cambioMutation]);

  const handleReset = () => {
    setSelectedPaziente(null);
    setSelectedMedico(null);
    setMotivazione("");
    setNoteInterne("");
    setSearchPaziente("");
    setSearchMedico("");
    setResult(null);
  };

  const canProceed =
    selectedPaziente && selectedMedico && motivazione.trim().length >= 10;

  // ── Risultato operazione completata ──
  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cambio Medico Diretto</h1>
          <Link href="/admin/medici/richieste-cambio">
            <Button variant="outline" size="sm">
              ← Richieste cambio
            </Button>
          </Link>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="h-8 w-8 text-green-600 mt-1" />
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-green-800">
                  Cambio medico completato con successo
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Paziente</p>
                    <p className="font-medium">
                      {result.paziente.nome} {result.paziente.cognome}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Medico precedente</p>
                    <p className="font-medium">
                      {result.medicoPrecedente
                        ? result.medicoPrecedente.nome
                        : "Nessuno"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Nuovo medico</p>
                    <p className="font-medium text-green-700">
                      {result.nuovoMedico.nome}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Data esecuzione</p>
                    <p className="font-medium">
                      {new Date(result.dataEsecuzione).toLocaleString("it-IT")}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Motivazione:</strong> {result.motivazione}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleReset}>Esegui un altro cambio</Button>
      </div>
    );
  }

  // ── Form principale ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="h-7 w-7 text-red-600" />
            Cambio Medico Diretto
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Operazione critica — solo per il personale di sistema
          </p>
        </div>
        <Link href="/admin/medici/richieste-cambio">
          <Button variant="outline" size="sm">
            ← Richieste cambio
          </Button>
        </Link>
      </div>

      {/* Warning */}
      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              <strong>Attenzione:</strong> Questo cambio è immediato e definitivo.
              Le visite future prenotate col vecchio medico verranno cancellate.
              La motivazione viene registrata nello storico ed è obbligatoria.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: Seleziona paziente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                1
              </span>
              Seleziona Paziente
            </CardTitle>
            <CardDescription>Cerca per nome, cognome o codice fiscale</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca paziente..."
                value={searchPaziente}
                onChange={(e) => setSearchPaziente(e.target.value)}
                className="pl-10"
              />
            </div>

            {loadingPazienti && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Ricerca...
              </div>
            )}

            {pazientiData?.data && pazientiData.data.length > 0 && !selectedPaziente && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {pazientiData.data.map((p: Paziente) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPaziente(p);
                      setSelectedMedico(null);
                    }}
                    className="w-full text-left p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {p.nome} {p.cognome}
                        </p>
                        <p className="text-xs text-gray-500">
                          {p.codiceFiscale || p.email || "—"} · {p.citta || "Città N/D"}
                        </p>
                      </div>
                      {p.medicoCurante ? (
                        <Badge variant="outline" className="text-xs">
                          Dr. {p.medicoCurante.cognome}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs">
                          Senza medico
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedPaziente && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-semibold">
                        {selectedPaziente.nome} {selectedPaziente.cognome}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedPaziente.codiceFiscale || selectedPaziente.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedPaziente.citta}
                        {selectedPaziente.provincia ? ` (${selectedPaziente.provincia})` : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPaziente(null);
                      setSelectedMedico(null);
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                {selectedPaziente.medicoCurante && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-xs text-gray-500">Medico attuale:</p>
                    <p className="text-sm font-medium">
                      Dr. {selectedPaziente.medicoCurante.nome}{" "}
                      {selectedPaziente.medicoCurante.cognome}
                      <span className="text-gray-400 ml-2">
                        ({selectedPaziente.medicoCurante.citta || "—"})
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Seleziona nuovo medico */}
        <Card className={!selectedPaziente ? "opacity-50 pointer-events-none" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-green-100 text-green-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                2
              </span>
              Seleziona Nuovo Medico
            </CardTitle>
            <CardDescription>
              {selectedPaziente?.citta
                ? `Medici nella zona di ${selectedPaziente.citta}`
                : "Seleziona prima un paziente"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Filtra medici..."
                value={searchMedico}
                onChange={(e) => setSearchMedico(e.target.value)}
                className="pl-10"
              />
            </div>

            {loadingMedici && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Ricerca...
              </div>
            )}

            {!selectedMedico && mediciData && Array.isArray(mediciData) && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {mediciData.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nessun medico trovato
                  </p>
                ) : (
                  mediciData.map((m: MedicoCandidato) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMedico(m)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-green-50 hover:border-green-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            Dr. {m.nome} {m.cognome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {m.specializzazione || "Medico base"} · {m.citta || "—"}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {m._count?.pazienti ?? 0} pazienti
                        </Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedMedico && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-semibold">
                        Dr. {selectedMedico.nome} {selectedMedico.cognome}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedMedico.specializzazione || "Medico di base"} ·{" "}
                        {selectedMedico.citta}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedMedico._count?.pazienti ?? 0} pazienti attuali
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMedico(null)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Step 3: Motivazione e conferma */}
      <Card className={!selectedPaziente || !selectedMedico ? "opacity-50 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="bg-red-100 text-red-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
              3
            </span>
            Motivazione e Conferma
          </CardTitle>
          <CardDescription>
            La motivazione è obbligatoria e viene registrata nello storico (min. 10 caratteri)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="motivazione" className="font-semibold">
              Motivazione del cambio *
            </Label>
            <Textarea
              id="motivazione"
              placeholder="Es: Trasferimento del paziente in altra città, pensionamento del medico, richiesta del paziente per incompatibilità..."
              value={motivazione}
              onChange={(e) => setMotivazione(e.target.value)}
              rows={3}
              className="mt-1"
            />
            <p className="text-xs text-gray-400 mt-1">
              {motivazione.length}/10 caratteri minimi
            </p>
          </div>

          <div>
            <Label htmlFor="note" className="font-semibold">
              Note interne (facoltative)
            </Label>
            <Textarea
              id="note"
              placeholder="Note visibili solo agli admin..."
              value={noteInterne}
              onChange={(e) => setNoteInterne(e.target.value)}
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Riepilogo */}
          {selectedPaziente && selectedMedico && (
            <div className="p-4 rounded-lg bg-gray-50 border">
              <p className="text-sm font-medium mb-2">Riepilogo operazione:</p>
              <div className="flex items-center gap-3 text-sm">
                <span>
                  {selectedPaziente.nome} {selectedPaziente.cognome}
                </span>
                <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                <span className="line-through text-red-500">
                  {selectedPaziente.medicoCurante
                    ? `Dr. ${selectedPaziente.medicoCurante.cognome}`
                    : "Nessuno"}
                </span>
                <span className="text-green-600 font-medium">
                  → Dr. {selectedMedico.cognome}
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={!canProceed}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            size="lg"
          >
            <Shield className="h-5 w-5 mr-2" />
            Esegui Cambio Medico
          </Button>
        </CardContent>
      </Card>

      {/* Dialog conferma */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Conferma Cambio Medico Diretto
            </DialogTitle>
            <DialogDescription>
              Questa operazione è irreversibile. Verranno cancellate le visite future
              prenotate con il medico attuale.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Paziente</p>
                <p className="font-medium">
                  {selectedPaziente?.nome} {selectedPaziente?.cognome}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Medico attuale</p>
                <p className="font-medium">
                  {selectedPaziente?.medicoCurante
                    ? `Dr. ${selectedPaziente.medicoCurante.nome} ${selectedPaziente.medicoCurante.cognome}`
                    : "Nessuno"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Nuovo medico</p>
                <p className="font-semibold text-green-700">
                  Dr. {selectedMedico?.nome} {selectedMedico?.cognome}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Motivazione</p>
                <p className="font-medium text-xs">{motivazione}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={cambioMutation.isPending}
            >
              Annulla
            </Button>
            <Button
              onClick={handleConfirmChange}
              disabled={cambioMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cambioMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Esecuzione...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" /> Confermo il cambio
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
