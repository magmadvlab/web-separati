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
import { useToast } from "@/hooks/use-toast";
import { classifyOrder, getOrderTypeLabel } from "@/lib/order-classification";
import type { ApiResponse, Ordine } from "@/types/api";
import Link from "next/link";

export default function FarmaciaOrdiniPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ordini, isLoading } = useQuery<Ordine[]>({
    queryKey: ["farmacia-ordini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine[]>>("/farmacia/ordini");
      return response.data.data;
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

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ordini Immediati</h1>
          <p className="text-gray-600 mt-2">
            Ordini diretti da farmaco da banco o consegna immediata.
            Gli ordini batch si gestiscono nella sezione{" "}
            <Link href="/farmacia/batch" className="text-purple-600 underline">
              Batch Delivery
            </Link>
            .
          </p>
        </div>
        <Link href="/farmacia/batch">
          <Button variant="outline">📦 Vai a Batch Delivery</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordini ({ordini?.length || 0})</CardTitle>
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
                {ordini.map((ordine) => {
                  const tipoOrdine = classifyOrder(ordine);
                  return (
                    <TableRow key={ordine.id}>
                      <TableCell className="font-medium">#{ordine.id}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-xs w-fit ${
                          tipoOrdine === 'misto'
                            ? 'bg-violet-100 text-violet-800'
                            : tipoOrdine === 'prescrizione'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {getOrderTypeLabel(tipoOrdine)}
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
                          ? `€${Number(ordine.importoTotale || 0).toFixed(2)}`
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
                              onClick={() => marcaProntoMutation.mutate(ordine.id)}
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
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-gray-600">
              Nessun ordine immediato trovato
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
