"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Pill,
  Calendar,
  TrendingUp
} from "lucide-react";
import type { ApiResponse } from "@/types/api";

interface AssunzioneProgrammata {
  id: number;
  dataOraProgrammata: string;
  confermata: boolean;
  saltata: boolean;
  note?: string;
  terapia: {
    id: number;
    posologia: string;
    conPasto: boolean;
    farmaco: {
      nomeCommerciale: string;
      principioAttivo: string;
    };
  };
}

interface StatisticheAderenza {
  totaleAssunzioni: number;
  assunzioniConfermate: number;
  assunzioniSaltate: number;
  assunzioniMancate: number;
  percentualeAderenza: number;
}

export function MedicationReminders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAssunzione, setSelectedAssunzione] = useState<AssunzioneProgrammata | null>(null);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [confirmNote, setConfirmNote] = useState("");

  // Carica assunzioni programmate
  const { data: assunzioniProgrammate, isLoading: loadingProgrammate } = useQuery<AssunzioneProgrammata[]>({
    queryKey: ["paziente-assunzioni-programmate"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AssunzioneProgrammata[]>>("/paziente/assunzioni-programmate?giorni=3");
      return response.data.data;
    },
    refetchInterval: 5 * 60 * 1000, // Ricarica ogni 5 minuti
  });

  // Carica assunzioni mancate
  const { data: assunzioniMancate, isLoading: loadingMancate } = useQuery<AssunzioneProgrammata[]>({
    queryKey: ["paziente-assunzioni-mancate"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AssunzioneProgrammata[]>>("/paziente/assunzioni-mancate");
      return response.data.data;
    },
  });

  // Carica statistiche aderenza
  const { data: statisticheAderenza } = useQuery<StatisticheAderenza>({
    queryKey: ["paziente-aderenza-terapia"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<StatisticheAderenza>>("/paziente/aderenza-terapia?giorni=30");
      return response.data.data;
    },
  });

  // Mutation per confermare assunzione
  const confirmMutation = useMutation({
    mutationFn: async ({ id, note }: { id: number; note?: string }) => {
      await api.post(`/paziente/assunzioni/${id}/conferma`, {
        note,
        metodoConferma: "app",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-assunzioni-programmate"] });
      queryClient.invalidateQueries({ queryKey: ["paziente-assunzioni-mancate"] });
      queryClient.invalidateQueries({ queryKey: ["paziente-aderenza-terapia"] });
      toast({
        title: "✅ Assunzione confermata",
        description: "L'assunzione è stata registrata con successo",
      });
      setSelectedAssunzione(null);
      setConfirmNote("");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.message || "Errore durante la conferma",
        variant: "destructive",
      });
    },
  });

  // Mutation per saltare assunzione
  const skipMutation = useMutation({
    mutationFn: async ({ id, motivoSalto }: { id: number; motivoSalto: string }) => {
      await api.post(`/paziente/assunzioni/${id}/salta`, {
        motivoSalto,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-assunzioni-programmate"] });
      queryClient.invalidateQueries({ queryKey: ["paziente-assunzioni-mancate"] });
      queryClient.invalidateQueries({ queryKey: ["paziente-aderenza-terapia"] });
      toast({
        title: "Assunzione saltata",
        description: "L'assunzione è stata registrata come saltata",
      });
      setShowSkipDialog(false);
      setSkipReason("");
      setSelectedAssunzione(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.message || "Errore durante l'operazione",
        variant: "destructive",
      });
    },
  });

  const formatDataAssunzione = (dataStr: string) => {
    const data = new Date(dataStr);
    const ora = format(data, "HH:mm");
    
    if (isToday(data)) {
      return `Oggi alle ${ora}`;
    } else if (isTomorrow(data)) {
      return `Domani alle ${ora}`;
    } else if (isYesterday(data)) {
      return `Ieri alle ${ora}`;
    } else {
      return format(data, "dd MMM 'alle' HH:mm", { locale: it });
    }
  };

  const getStatusBadge = (assunzione: AssunzioneProgrammata) => {
    if (assunzione.confermata) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Confermata</Badge>;
    }
    if (assunzione.saltata) {
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Saltata</Badge>;
    }
    
    const ora = new Date(assunzione.dataOraProgrammata);
    const adesso = new Date();
    
    if (ora < adesso) {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Mancata</Badge>;
    }
    
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Programmata</Badge>;
  };

  const isPastDue = (dataStr: string) => {
    return new Date(dataStr) < new Date();
  };

  const canConfirm = (assunzione: AssunzioneProgrammata) => {
    return !assunzione.confermata && !assunzione.saltata;
  };

  if (loadingProgrammate || loadingMancate) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-gray-500">Caricamento reminder...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiche Aderenza */}
      {statisticheAderenza && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Aderenza Terapeutica (ultimi 30 giorni)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {statisticheAderenza.percentualeAderenza}%
                </div>
                <div className="text-sm text-gray-600">Aderenza</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {statisticheAderenza.assunzioniConfermate}
                </div>
                <div className="text-sm text-gray-600">Confermate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {statisticheAderenza.assunzioniSaltate}
                </div>
                <div className="text-sm text-gray-600">Saltate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {statisticheAderenza.assunzioniMancate}
                </div>
                <div className="text-sm text-gray-600">Mancate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assunzioni Mancate */}
      {assunzioniMancate && assunzioniMancate.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5" />
              Assunzioni Mancate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assunzioniMancate.map((assunzione) => (
                <div key={assunzione.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Pill className="w-4 h-4 text-red-600" />
                    <div>
                      <div className="font-medium text-red-900">
                        {assunzione.terapia.farmaco.nomeCommerciale}
                      </div>
                      <div className="text-sm text-red-700">
                        {formatDataAssunzione(assunzione.dataOraProgrammata)}
                      </div>
                    </div>
                  </div>
                  {canConfirm(assunzione) && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedAssunzione(assunzione)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Conferma ora
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAssunzione(assunzione);
                          setShowSkipDialog(true);
                        }}
                      >
                        Salta
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prossime Assunzioni */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Prossime Assunzioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!assunzioniProgrammate || assunzioniProgrammate.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              Nessuna assunzione programmata nei prossimi giorni
            </div>
          ) : (
            <div className="space-y-3">
              {assunzioniProgrammate.map((assunzione) => (
                <div key={assunzione.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Pill className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <div className="font-medium">
                        {assunzione.terapia.farmaco.nomeCommerciale}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDataAssunzione(assunzione.dataOraProgrammata)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {assunzione.terapia.posologia}
                        {assunzione.terapia.conPasto ? " • Con il pasto" : " • A stomaco vuoto"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(assunzione)}
                    {canConfirm(assunzione) && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedAssunzione(assunzione)}
                          disabled={!isPastDue(assunzione.dataOraProgrammata)}
                        >
                          Conferma
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAssunzione(assunzione);
                            setShowSkipDialog(true);
                          }}
                        >
                          Salta
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Conferma Assunzione */}
      <Dialog open={!!selectedAssunzione && !showSkipDialog} onOpenChange={() => setSelectedAssunzione(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma Assunzione</DialogTitle>
          </DialogHeader>
          {selectedAssunzione && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">{selectedAssunzione.terapia.farmaco.nomeCommerciale}</div>
                <div className="text-sm text-gray-600">
                  {formatDataAssunzione(selectedAssunzione.dataOraProgrammata)}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedAssunzione.terapia.posologia}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Note (opzionale)
                </label>
                <Textarea
                  value={confirmNote}
                  onChange={(e) => setConfirmNote(e.target.value)}
                  placeholder="Aggiungi eventuali note sull'assunzione..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => confirmMutation.mutate({ id: selectedAssunzione.id, note: confirmNote })}
                  disabled={confirmMutation.isPending}
                  className="flex-1"
                >
                  {confirmMutation.isPending ? "Confermando..." : "Conferma Assunzione"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedAssunzione(null)}
                  disabled={confirmMutation.isPending}
                >
                  Annulla
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Salta Assunzione */}
      <Dialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salta Assunzione</DialogTitle>
          </DialogHeader>
          {selectedAssunzione && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">{selectedAssunzione.terapia.farmaco.nomeCommerciale}</div>
                <div className="text-sm text-gray-600">
                  {formatDataAssunzione(selectedAssunzione.dataOraProgrammata)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Motivo *
                </label>
                <Select value={skipReason} onValueChange={setSkipReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona il motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dimenticato">Dimenticato</SelectItem>
                    <SelectItem value="effetti_collaterali">Effetti collaterali</SelectItem>
                    <SelectItem value="non_disponibile">Farmaco non disponibile</SelectItem>
                    <SelectItem value="malattia">Malattia/vomito</SelectItem>
                    <SelectItem value="viaggio">In viaggio</SelectItem>
                    <SelectItem value="altro">Altro motivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => skipMutation.mutate({ id: selectedAssunzione.id, motivoSalto: skipReason })}
                  disabled={skipMutation.isPending || !skipReason}
                  variant="outline"
                  className="flex-1"
                >
                  {skipMutation.isPending ? "Salvando..." : "Salta Assunzione"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSkipDialog(false);
                    setSkipReason("");
                  }}
                  disabled={skipMutation.isPending}
                >
                  Annulla
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}