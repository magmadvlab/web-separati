"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { Calendar, Clock, User, FileText, CheckCircle2, Eye, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface Prenotazione {
  id: number;
  codicePrenotazione: string;
  dataOraAppuntamento: string;
  stato: string;
  tipoPagamento: string;
  paziente: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale: string;
    telefono?: string;
  };
  servizio: {
    id: number;
    nome: string;
  };
  prescrizioneAnalisi?: {
    id: number;
    tipo: string;
  };
}

const statiBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  prenotata: { label: "Prenotata", variant: "default" },
  confermata: { label: "Confermata", variant: "secondary" },
  completata: { label: "Completata", variant: "secondary" },
  risultato_disponibile: { label: "Risultato Disponibile", variant: "default" },
  cancellata: { label: "Cancellata", variant: "destructive" },
};

export default function PrenotazioniPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filtroStato, setFiltroStato] = useState("all");
  const [filtroData, setFiltroData] = useState("");
  const [selectedPazienteId, setSelectedPazienteId] = useState<number | null>(null);

  const { data: prenotazioni, isLoading } = useQuery<Prenotazione[]>({
    queryKey: ["prenotazioni-laboratorio", filtroStato, filtroData],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtroStato && filtroStato !== "all") params.append("stato", filtroStato);
      if (filtroData) params.append("data", filtroData);

      const response = await api.get<ApiResponse<Prenotazione[]>>(
        `/laboratori/dashboard/prenotazioni?${params.toString()}`
      );
      return response.data.data || [];
    },
  });

  const aggiornaStatoMutation = useMutation({
    mutationFn: async ({ id, stato, note }: { id: number; stato: string; note?: string }) => {
      const response = await api.put<ApiResponse<Prenotazione>>(
        `/laboratori/dashboard/prenotazioni/${id}/stato`,
        { stato, note }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prenotazioni-laboratorio"] });
      toast({
        title: "Stato aggiornato",
        description: "Lo stato della prenotazione è stato aggiornato",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!prenotazioni || prenotazioni.length === 0) {
      setSelectedPazienteId(null);
      return;
    }

    if (!selectedPazienteId || !prenotazioni.some((item) => item.paziente.id === selectedPazienteId)) {
      setSelectedPazienteId(prenotazioni[0].paziente.id);
    }
  }, [prenotazioni, selectedPazienteId]);

  const quadroAssistito = useMemo(() => {
    if (!prenotazioni || !selectedPazienteId) return null;

    const storico = [...prenotazioni]
      .filter((item) => item.paziente.id === selectedPazienteId)
      .sort(
        (a, b) =>
          new Date(b.dataOraAppuntamento).getTime() - new Date(a.dataOraAppuntamento).getTime(),
      );

    if (!storico.length) return null;

    return {
      paziente: storico[0].paziente,
      storico,
      totalePrenotazioni: storico.length,
      inCarico: storico.filter((item) => ["prenotata", "confermata"].includes(item.stato)).length,
      completate: storico.filter((item) => ["completata", "risultato_disponibile"].includes(item.stato))
        .length,
      analisiPrescritte: storico.filter((item) => Boolean(item.prescrizioneAnalisi?.id)).length,
    };
  }, [prenotazioni, selectedPazienteId]);

  const handleCancellaPrenotazione = (prenotazioneId: number) => {
    if (!window.confirm("Confermi la cancellazione di questa prenotazione?")) {
      return;
    }

    const motivo = window.prompt("Motivo cancellazione (opzionale):") || undefined;

    aggiornaStatoMutation.mutate({
      id: prenotazioneId,
      stato: "cancellata",
      note: motivo,
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent p-6 border border-blue-500/20"
      >
        <div className="absolute inset-0 shimmer opacity-30" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Prenotazioni
          </h1>
          <p className="text-gray-600 mt-2">Gestisci le prenotazioni degli esami</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="hover-lift">
        <CardHeader>
          <CardTitle>Filtri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <Label htmlFor="stato">Stato</Label>
              <Select value={filtroStato} onValueChange={setFiltroStato}>
                <SelectTrigger id="stato" className="w-[200px]">
                  <SelectValue placeholder="Tutti gli stati" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="prenotata">Prenotata</SelectItem>
                  <SelectItem value="confermata">Confermata</SelectItem>
                  <SelectItem value="completata">Completata</SelectItem>
                  <SelectItem value="risultato_disponibile">Risultato Disponibile</SelectItem>
                  <SelectItem value="cancellata">Cancellata</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="w-[200px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {quadroAssistito && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle>
                Quadro generale assistito: {quadroAssistito.paziente.nome} {quadroAssistito.paziente.cognome}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-gray-500">Prenotazioni totali</div>
                  <div className="text-xl font-semibold">{quadroAssistito.totalePrenotazioni}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-gray-500">In carico</div>
                  <div className="text-xl font-semibold">{quadroAssistito.inCarico}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-gray-500">Completate</div>
                  <div className="text-xl font-semibold">{quadroAssistito.completate}</div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-gray-500">Analisi prescritte</div>
                  <div className="text-xl font-semibold">{quadroAssistito.analisiPrescritte}</div>
                </div>
              </div>

              <div className="space-y-2">
                {quadroAssistito.storico.slice(0, 6).map((item) => (
                  <div key={`storico-${item.id}`} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{item.servizio.nome}</div>
                      <Badge variant={(statiBadge[item.stato] || statiBadge.prenotata).variant}>
                        {(statiBadge[item.stato] || statiBadge.prenotata).label}
                      </Badge>
                    </div>
                    <div className="text-gray-600 mt-1">
                      {new Date(item.dataOraAppuntamento).toLocaleString("it-IT")}
                      {item.prescrizioneAnalisi?.tipo ? ` • Prescrizione: ${item.prescrizioneAnalisi.tipo}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {prenotazioni && prenotazioni.length > 0 ? (
        <div className="space-y-4">
          {prenotazioni.map((prenotazione, index) => {
            const statoBadge = statiBadge[prenotazione.stato] || { label: prenotazione.stato, variant: "default" };
            const dataOra = new Date(prenotazione.dataOraAppuntamento);

            return (
              <motion.div
                key={prenotazione.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover-lift">
                  <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{prenotazione.servizio.nome}</h3>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200, delay: index * 0.1 }}
                        >
                          <Badge variant={statoBadge.variant}>{statoBadge.label}</Badge>
                        </motion.div>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>
                              {prenotazione.paziente.nome} {prenotazione.paziente.cognome}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>CF: {prenotazione.paziente.codiceFiscale}</span>
                          </div>
                          {prenotazione.paziente.telefono && (
                            <div className="flex items-center gap-1">
                              <span>Tel: {prenotazione.paziente.telefono}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{dataOra.toLocaleDateString("it-IT")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{dataOra.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            <span>Codice: {prenotazione.codicePrenotazione}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={selectedPazienteId === prenotazione.paziente.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedPazienteId(prenotazione.paziente.id)}
                          className="hover-lift"
                        >
                          Quadro assistito
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/laboratorio/prenotazioni/${prenotazione.id}`)}
                          className="hover-lift"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Dettagli
                        </Button>
                      </motion.div>
                      {prenotazione.stato === "prenotata" && (
                        <>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              size="sm"
                              onClick={() => {
                                aggiornaStatoMutation.mutate({
                                  id: prenotazione.id,
                                  stato: "confermata",
                                });
                              }}
                              disabled={aggiornaStatoMutation.isPending}
                              className="hover-lift"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Conferma
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancellaPrenotazione(prenotazione.id)}
                              disabled={aggiornaStatoMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancella
                            </Button>
                          </motion.div>
                        </>
                      )}
                      {prenotazione.stato === "confermata" && (
                        <>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              size="sm"
                              onClick={() => {
                                aggiornaStatoMutation.mutate({
                                  id: prenotazione.id,
                                  stato: "completata",
                                });
                              }}
                              disabled={aggiornaStatoMutation.isPending}
                              className="hover-lift"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Completa
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancellaPrenotazione(prenotazione.id)}
                              disabled={aggiornaStatoMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancella
                            </Button>
                          </motion.div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="inline-block"
                >
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
                </motion.div>
                <p className="text-gray-500 font-medium">Nessuna prenotazione trovata</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
