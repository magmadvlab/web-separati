"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Syringe, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  FileText
} from "lucide-react";
import type { ApiResponse } from "@/types/api";

interface Vaccinazione {
  id: number;
  nome: string;
  dataVaccinazione: string;
  lotto?: string;
  sede?: string;
  note?: string;
  createdAt: string;
}

interface PianoCurePreventive {
  controlliConsigliati: Array<{
    tipo: string;
    descrizione: string;
    frequenza: string;
    ultimoControllo?: string;
    prossimoControllo?: string;
    priorita: "alta" | "media" | "bassa";
  }>;
  vaccinazioniConsigliate: Array<{
    nome: string;
    descrizione: string;
    motivazione: string;
    urgenza: "alta" | "media" | "bassa";
  }>;
}

export default function CurePreventivePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nuovaVaccinazione, setNuovaVaccinazione] = useState({
    nome: "",
    dataVaccinazione: "",
    lotto: "",
    sede: "",
    note: "",
  });

  const { data: piano, isLoading: loadingPiano } = useQuery<PianoCurePreventive>({
    queryKey: ["cure-preventive"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PianoCurePreventive>>("/paziente/cure-preventive");
      return response.data.data || response.data;
    },
  });

  const { data: vaccinazioni, isLoading: loadingVaccinazioni } = useQuery<Vaccinazione[]>({
    queryKey: ["vaccinazioni"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Vaccinazione[]>>("/paziente/cure-preventive/vaccinazioni");
      return response.data.data || response.data;
    },
  });

  const registraVaccinazioneMutation = useMutation({
    mutationFn: async (data: typeof nuovaVaccinazione) => {
      const response = await api.post<ApiResponse<Vaccinazione>>(
        "/paziente/cure-preventive/vaccinazioni",
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vaccinazioni"] });
      queryClient.invalidateQueries({ queryKey: ["cure-preventive"] });
      toast({
        title: "Vaccinazione registrata",
        description: "La vaccinazione è stata aggiunta con successo",
      });
      setIsDialogOpen(false);
      setNuovaVaccinazione({
        nome: "",
        dataVaccinazione: "",
        lotto: "",
        sede: "",
        note: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.message || "Errore durante la registrazione",
        variant: "destructive",
      });
    },
  });

  const getPrioritaColor = (priorita: string) => {
    switch (priorita) {
      case "alta":
        return "bg-red-100 text-red-800 border-red-300";
      case "media":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "bassa":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getPrioritaIcon = (priorita: string) => {
    switch (priorita) {
      case "alta":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "media":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "bassa":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  if (loadingPiano || loadingVaccinazioni) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Cure Preventive
          </h1>
          <p className="text-gray-600 mt-2">
            Gestisci il tuo piano di prevenzione e le vaccinazioni
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registra Vaccinazione
        </Button>
      </div>

      {/* Piano Cure Preventive */}
      {piano && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Controlli Consigliati */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Controlli Consigliati
              </CardTitle>
            </CardHeader>
            <CardContent>
              {piano.controlliConsigliati && piano.controlliConsigliati.length > 0 ? (
                <div className="space-y-3">
                  {piano.controlliConsigliati.map((controllo, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{controllo.tipo}</h4>
                            <Badge className={getPrioritaColor(controllo.priorita)}>
                              {getPrioritaIcon(controllo.priorita)}
                              <span className="ml-1 capitalize">{controllo.priorita}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{controllo.descrizione}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Frequenza: {controllo.frequenza}</div>
                        {controllo.prossimoControllo && (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Calendar className="h-3 w-3" />
                            Prossimo: {new Date(controllo.prossimoControllo).toLocaleDateString("it-IT")}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nessun controllo consigliato al momento
                </p>
              )}
            </CardContent>
          </Card>

          {/* Vaccinazioni Consigliate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-green-600" />
                Vaccinazioni Consigliate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {piano.vaccinazioniConsigliate && piano.vaccinazioniConsigliate.length > 0 ? (
                <div className="space-y-3">
                  {piano.vaccinazioniConsigliate.map((vaccino, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{vaccino.nome}</h4>
                            <Badge className={getPrioritaColor(vaccino.urgenza)}>
                              {getPrioritaIcon(vaccino.urgenza)}
                              <span className="ml-1 capitalize">{vaccino.urgenza}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{vaccino.descrizione}</p>
                          <p className="text-xs text-gray-500 italic">{vaccino.motivazione}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nessuna vaccinazione consigliata al momento
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Storico Vaccinazioni */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" />
            Storico Vaccinazioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vaccinazioni && vaccinazioni.length > 0 ? (
            <div className="space-y-3">
              {vaccinazioni.map((vaccino) => (
                <div key={vaccino.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium">{vaccino.nome}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(vaccino.dataVaccinazione).toLocaleDateString("it-IT")}
                        </div>
                        {vaccino.lotto && (
                          <div>Lotto: {vaccino.lotto}</div>
                        )}
                        {vaccino.sede && (
                          <div>Sede: {vaccino.sede}</div>
                        )}
                      </div>
                      {vaccino.note && (
                        <p className="text-xs text-gray-500 mt-2 italic">{vaccino.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Syringe className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-4">Nessuna vaccinazione registrata</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Registra Prima Vaccinazione
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Registra Vaccinazione */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registra Vaccinazione</DialogTitle>
            <DialogDescription>
              Aggiungi una nuova vaccinazione al tuo storico
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome Vaccino *</label>
              <Input
                value={nuovaVaccinazione.nome}
                onChange={(e) => setNuovaVaccinazione({ ...nuovaVaccinazione, nome: e.target.value })}
                placeholder="Es. Antinfluenzale, COVID-19, Tetano..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Data Vaccinazione *</label>
              <Input
                type="date"
                value={nuovaVaccinazione.dataVaccinazione}
                onChange={(e) => setNuovaVaccinazione({ ...nuovaVaccinazione, dataVaccinazione: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lotto</label>
              <Input
                value={nuovaVaccinazione.lotto}
                onChange={(e) => setNuovaVaccinazione({ ...nuovaVaccinazione, lotto: e.target.value })}
                placeholder="Numero lotto vaccino"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sede Inoculazione</label>
              <Input
                value={nuovaVaccinazione.sede}
                onChange={(e) => setNuovaVaccinazione({ ...nuovaVaccinazione, sede: e.target.value })}
                placeholder="Es. Braccio sinistro, Coscia destra..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Note</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={nuovaVaccinazione.note}
                onChange={(e) => setNuovaVaccinazione({ ...nuovaVaccinazione, note: e.target.value })}
                placeholder="Note aggiuntive..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => registraVaccinazioneMutation.mutate(nuovaVaccinazione)}
                disabled={!nuovaVaccinazione.nome || !nuovaVaccinazione.dataVaccinazione || registraVaccinazioneMutation.isPending}
                className="flex-1"
              >
                {registraVaccinazioneMutation.isPending ? "Salvando..." : "Registra"}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annulla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
