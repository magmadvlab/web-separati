"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loading } from "@/components/shared/Loading";
import type { ApiResponse } from "@/types/api";

interface Consenso {
  id: number;
  tipoConsenso: string;
  versione: string;
  testoConsenso: string;
  consensoDato: boolean;
  dataConsenso: string | null;
  dataRevoca: string | null;
  stato: string;
  hashFirma: string | null;
  storicoConsensi?: StoricoConsenso[];
}

interface StoricoConsenso {
  id: number;
  consensoId: number;
  azione: string;
  versionePrecedente: string | null;
  versioneNuova: string | null;
  dataAzione: string;
  ipAddress: string | null;
  userAgent: string | null;
}

const TIPI_CONSENSO = {
  TRATTAMENTO_DATI_SANITARI: "Trattamento Dati Sanitari",
  COMUNICAZIONE_MEDICO: "Comunicazione con Medico",
  INVIO_FARMACIA: "Invio Ricette a Farmacia",
  CONSERVAZIONE_DATI: "Conservazione Dati",
};

export function ConsensiManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);

  const { data: consensi, isLoading } = useQuery<Consenso[]>({
    queryKey: ["consensi-attivi"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Consenso[]>>("/consensi");
      return response.data.data;
    },
  });

  const { data: storico } = useQuery<Consenso[]>({
    queryKey: ["consensi-storico"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Consenso[]>>("/consensi/storico");
      return response.data.data;
    },
  });

  const raccogliConsensoMutation = useMutation({
    mutationFn: async (tipoConsenso: string) => {
      const response = await api.post<ApiResponse<Consenso>>("/consensi", {
        tipoConsenso,
        versione: "1.0",
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consensi-attivi"] });
      queryClient.invalidateQueries({ queryKey: ["consensi-storico"] });
      toast({
        title: "Consenso registrato",
        description: "Il tuo consenso è stato salvato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante il salvataggio del consenso",
        variant: "destructive",
      });
    },
  });

  const revocaConsensoMutation = useMutation({
    mutationFn: async (tipoConsenso: string) => {
      const response = await api.delete<ApiResponse<Consenso>>(`/consensi/${tipoConsenso}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consensi-attivi"] });
      queryClient.invalidateQueries({ queryKey: ["consensi-storico"] });
      toast({
        title: "Consenso revocato",
        description: "Il consenso è stato revocato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante la revoca del consenso",
        variant: "destructive",
      });
    },
  });

  const handleToggleConsenso = (tipoConsenso: string, attivo: boolean) => {
    if (attivo) {
      revocaConsensoMutation.mutate(tipoConsenso);
    } else {
      raccogliConsensoMutation.mutate(tipoConsenso);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const consensiAttivi = consensi || [];
  const consensiPerTipo = Object.keys(TIPI_CONSENSO).map((tipo) => {
    const consenso = consensiAttivi.find((c) => c.tipoConsenso === tipo);
    return {
      tipo,
      nome: TIPI_CONSENSO[tipo as keyof typeof TIPI_CONSENSO],
      consenso: consenso || null,
      attivo: consenso?.stato === "ATTIVO" && consenso?.consensoDato === true,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestione Consensi</h2>
        <p className="text-muted-foreground">
          Gestisci i tuoi consensi per il trattamento dei dati sanitari
        </p>
      </div>

      <Tabs defaultValue="consensi" className="w-full">
        <TabsList>
          <TabsTrigger value="consensi">Consensi Attivi</TabsTrigger>
          <TabsTrigger value="storico">Storico</TabsTrigger>
        </TabsList>

        <TabsContent value="consensi" className="space-y-4">
          {consensiPerTipo.map((item) => (
            <Card key={item.tipo}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={item.attivo}
                      onCheckedChange={() => handleToggleConsenso(item.tipo, item.attivo)}
                    />
                    <div>
                      <CardTitle className="text-lg">{item.nome}</CardTitle>
                      {item.consenso && (
                        <CardDescription>
                          Versione {item.consenso.versione} - Consenso dato il{" "}
                          {item.consenso.dataConsenso
                            ? new Date(item.consenso.dataConsenso).toLocaleDateString("it-IT")
                            : "N/A"}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant={item.attivo ? "default" : "secondary"}>
                    {item.attivo ? "Attivo" : "Non attivo"}
                  </Badge>
                </div>
              </CardHeader>
              {item.consenso && (
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {item.consenso.testoConsenso}
                    </p>
                    {selectedTipo === item.tipo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTipo(null)}
                      >
                        Nascondi dettagli
                      </Button>
                    )}
                    {selectedTipo !== item.tipo && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTipo(item.tipo)}
                      >
                        Mostra dettagli
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="storico" className="space-y-4">
          {storico && storico.length > 0 ? (
            storico.map((consenso) => (
              <Card key={consenso.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {TIPI_CONSENSO[consenso.tipoConsenso as keyof typeof TIPI_CONSENSO]}
                      </CardTitle>
                      <CardDescription>
                        Versione {consenso.versione} - Stato: {consenso.stato}
                      </CardDescription>
                    </div>
                    <Badge variant={consenso.stato === "ATTIVO" ? "default" : "secondary"}>
                      {consenso.stato}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>Data consenso:</strong>{" "}
                      {consenso.dataConsenso
                        ? new Date(consenso.dataConsenso).toLocaleString("it-IT")
                        : "N/A"}
                    </p>
                    {consenso.dataRevoca && (
                      <p>
                        <strong>Data revoca:</strong>{" "}
                        {new Date(consenso.dataRevoca).toLocaleString("it-IT")}
                      </p>
                    )}
                    {consenso.storicoConsensi && consenso.storicoConsensi.length > 0 && (
                      <div className="mt-4">
                        <p className="font-semibold mb-2">Storico modifiche:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {consenso.storicoConsensi.map((storico: StoricoConsenso) => (
                            <li key={storico.id}>
                              {storico.azione} il{" "}
                              {new Date(storico.dataAzione).toLocaleString("it-IT")}
                              {storico.versionePrecedente && (
                                <span>
                                  {" "}
                                  (da v{storico.versionePrecedente} a v
                                  {storico.versioneNuova || consenso.versione})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nessuno storico disponibile
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

