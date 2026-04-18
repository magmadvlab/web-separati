"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse, Ordine } from "@/types/api";
import Link from "next/link";

export default function FarmaciaOrdiniPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("tutti");

  const { data: ordini, isLoading } = useQuery<Ordine[]>({
    queryKey: ["farmacia-ordini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine[]>>("/farmacia/ordini");
      return response.data.data;
    },
  });

  const { data: batchAssignments, isLoading: isLoadingBatch } = useQuery({
    queryKey: ["farmacia-batch-assignments"],
    queryFn: async () => {
      const response = await api.get("/farmacia/batch/assignments");
      return response.data;
    },
  });

  const marcaProntoMutation = useMutation({
    mutationFn: async (ordineId: number) => {
      await api.put(`/farmacia/ordini/${ordineId}/pronto`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmacia-ordini"] });
      toast({
        title: "Ordine aggiornato",
        description: "L'ordine è stato marcato come pronto",
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

  const handleMarcaPronto = (ordineId: number) => {
    marcaProntoMutation.mutate(ordineId);
  };

  if (isLoading || isLoadingBatch) {
    return <Loading />;
  }

  const ordiniBatch = ordini?.filter((o: any) => o.modalitaOrdine === 'batch') || [];
  const ordiniImmediati = ordini?.filter((o: any) => o.modalitaOrdine !== 'batch') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ordini Ricevuti</h1>
        <p className="text-gray-600 mt-2">
          Gestisci gli ordini ricevuti dalla farmacia
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tutti">Tutti ({ordini?.length || 0})</TabsTrigger>
          <TabsTrigger value="immediati">Immediati ({ordiniImmediati.length})</TabsTrigger>
          <TabsTrigger value="batch">Batch ({ordiniBatch.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="tutti">
          <Card>
            <CardHeader>
              <CardTitle>Tutti gli Ordini</CardTitle>
            </CardHeader>
            <CardContent>
              {ordini && ordini.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codice Ordine</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Paziente</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Importo</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordini.map((ordine) => (
                      <TableRow key={ordine.id}>
                        <TableCell className="font-medium">#{ordine.id}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2 py-1 text-xs ${
                            (ordine as any).modalitaOrdine === 'batch' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {(ordine as any).modalitaOrdine === 'batch' ? '📦 Batch' : '⚡ Immediato'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {ordine.paziente
                            ? `${ordine.paziente.nome} ${ordine.paziente.cognome}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
                            {ordine.stato}
                          </span>
                        </TableCell>
                        <TableCell>
                          {ordine.importoTotale
                            ? `€${ordine.importoTotale.toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {ordine.stato === "creato" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  api.put(`/farmacia/ordini/${ordine.id}`, { stato: "in_preparazione" })
                                    .then(() => {
                                      queryClient.invalidateQueries({ queryKey: ["farmacia-ordini"] });
                                      toast({
                                        title: "Ordine aggiornato",
                                        description: "L'ordine è stato marcato come in preparazione",
                                      });
                                    })
                                    .catch((error: any) => {
                                      toast({
                                        title: "Errore",
                                        description: error?.response?.data?.error || "Errore durante l'aggiornamento",
                                        variant: "destructive",
                                      });
                                    });
                                }}
                              >
                                In Preparazione
                              </Button>
                            )}
                            {ordine.stato !== "pronto" && ordine.stato !== "consegnato" && (
                              <Button
                                size="sm"
                                onClick={() => handleMarcaPronto(ordine.id)}
                                disabled={marcaProntoMutation.isPending}
                              >
                                Marca Pronto
                              </Button>
                            )}
                            <Link href={`/farmacia/ordini/${ordine.id}`}>
                              <Button size="sm" variant="outline">
                                Dettagli
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-gray-600">
                  Nessun ordine trovato
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="immediati">
          <Card>
            <CardHeader>
              <CardTitle>Ordini Immediati</CardTitle>
            </CardHeader>
            <CardContent>
              {ordiniImmediati.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Codice Ordine</TableHead>
                      <TableHead>Paziente</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Importo</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordiniImmediati.map((ordine) => (
                      <TableRow key={ordine.id}>
                        <TableCell className="font-medium">#{ordine.id}</TableCell>
                        <TableCell>
                          {ordine.paziente
                            ? `${ordine.paziente.nome} ${ordine.paziente.cognome}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
                            {ordine.stato}
                          </span>
                        </TableCell>
                        <TableCell>
                          {ordine.importoTotale
                            ? `€${ordine.importoTotale.toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {ordine.stato === "creato" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  api.put(`/farmacia/ordini/${ordine.id}`, { stato: "in_preparazione" })
                                    .then(() => {
                                      queryClient.invalidateQueries({ queryKey: ["farmacia-ordini"] });
                                      toast({
                                        title: "Ordine aggiornato",
                                        description: "L'ordine è stato marcato come in preparazione",
                                      });
                                    })
                                    .catch((error: any) => {
                                      toast({
                                        title: "Errore",
                                        description: error?.response?.data?.error || "Errore durante l'aggiornamento",
                                        variant: "destructive",
                                      });
                                    });
                                }}
                              >
                                In Preparazione
                              </Button>
                            )}
                            {ordine.stato !== "pronto" && ordine.stato !== "consegnato" && (
                              <Button
                                size="sm"
                                onClick={() => handleMarcaPronto(ordine.id)}
                                disabled={marcaProntoMutation.isPending}
                              >
                                Marca Pronto
                              </Button>
                            )}
                            <Link href={`/farmacia/ordini/${ordine.id}`}>
                              <Button size="sm" variant="outline">
                                Dettagli
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-8 text-gray-600">
                  Nessun ordine immediato trovato
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Ordini Batch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">
                    📦 Sistema Batch Delivery
                  </h3>
                  <p className="text-sm text-purple-800 mb-3">
                    Gli ordini batch sono raggruppati per zona e consegnati in giornate specifiche.
                    Visualizza i batch assignments per gestire gli ordini consolidati.
                  </p>
                  <Link href="/farmacia/batch">
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Vedi Batch Assignments
                    </Button>
                  </Link>
                </div>

                {ordiniBatch.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codice Ordine</TableHead>
                        <TableHead>Paziente</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordiniBatch.map((ordine) => (
                        <TableRow key={ordine.id}>
                          <TableCell className="font-medium">#{ordine.id}</TableCell>
                          <TableCell>
                            {ordine.paziente
                              ? `${ordine.paziente.nome} ${ordine.paziente.cognome}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
                              {ordine.stato}
                            </span>
                          </TableCell>
                          <TableCell>
                            {(ordine as any).batchAssignmentId ? (
                              <Link href={`/farmacia/batch/${(ordine as any).batchAssignmentId}`}>
                                <Button size="sm" variant="link" className="text-purple-600">
                                  Batch #{(ordine as any).batchAssignmentId}
                                </Button>
                              </Link>
                            ) : (
                              <span className="text-xs text-gray-500">In attesa assegnazione</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Link href={`/farmacia/ordini/${ordine.id}`}>
                              <Button size="sm" variant="outline">
                                Dettagli
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-gray-600">
                    Nessun ordine batch trovato
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

