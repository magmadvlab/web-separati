"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Stethoscope, FileText, X } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function SuggestionsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("controlli");

  const { data: suggerimentiData } = useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const response = await api.get('/paziente/suggerimenti');
      return response.data;
    },
  });

  // Separa i suggerimenti per tipo
  const controlli = suggerimentiData?.filter((s: any) => s.tipo === 'terapia_scadenza') || [];
  const visite = suggerimentiData?.filter((s: any) => s.tipo === 'visita') || [];
  const analisi = suggerimentiData?.filter((s: any) => s.tipo === 'aderenza') || [];

  const requestApprovalMutation = useMutation({
    mutationFn: async (suggerimentoId: number) => {
      // Per ora disabilitato - endpoint non ancora implementato
      throw new Error("Funzionalità non ancora disponibile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions-analisi'] });
      toast({
        title: "Richiesta inviata",
        description: "La richiesta è stata inviata al medico curante",
      });
    },
  });

  const getPrioritaColor = (priorita: string) => {
    switch (priorita) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      case 'bassa':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggerimenti</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="controlli">
              <Stethoscope className="w-4 h-4 mr-2" />
              Controlli
            </TabsTrigger>
            <TabsTrigger value="visite">
              <Calendar className="w-4 h-4 mr-2" />
              Visite
            </TabsTrigger>
            <TabsTrigger value="analisi">
              <FileText className="w-4 h-4 mr-2" />
              Analisi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="controlli" className="space-y-3 mt-4">
            {!controlli || controlli.length === 0 ? (
              <p className="text-gray-600 text-sm">Nessun suggerimento disponibile</p>
            ) : (
              controlli.map((s: any, idx: number) => (
                <div key={s.id || idx} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{s.titolo}</h4>
                        <Badge variant={getPrioritaColor(s.priorita)}>
                          {s.priorita}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{s.descrizione}</p>
                      {s.azione && (
                        <p className="text-xs text-gray-500">
                          Azione: {s.azione}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="visite" className="space-y-3 mt-4">
            {!visite || visite.length === 0 ? (
              <p className="text-gray-600 text-sm">Nessun suggerimento disponibile</p>
            ) : (
              visite.map((s: any, idx: number) => (
                <div key={s.id || idx} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{s.titolo}</h4>
                        <Badge variant={getPrioritaColor(s.priorita)}>
                          {s.priorita}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{s.descrizione}</p>
                      {s.azione && (
                        <p className="text-xs text-gray-500">
                          Azione: {s.azione}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="analisi" className="space-y-3 mt-4">
            {!analisi || analisi.length === 0 ? (
              <p className="text-gray-600 text-sm">Nessun suggerimento disponibile</p>
            ) : (
              analisi.map((s: any, idx: number) => (
                <div key={s.id || idx} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{s.titolo}</h4>
                        <Badge variant={getPrioritaColor(s.priorita)}>
                          {s.priorita}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{s.descrizione}</p>
                      {s.azione && (
                        <p className="text-xs text-gray-500">
                          Azione: {s.azione}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}




