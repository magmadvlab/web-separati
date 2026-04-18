"use client";

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
import type { ApiResponse, Ordine } from "@/types/api";
import Link from "next/link";

export default function DeliveryOrdiniPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ordini, isLoading } = useQuery<Ordine[]>({
    queryKey: ["delivery-rider-ordini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine[]>>("/delivery/rider/ordini");
      return response.data.data;
    },
  });

  const marcaInConsegnaMutation = useMutation({
    mutationFn: async (ordineId: number) => {
      await api.put(`/delivery/ordini/${ordineId}/in-consegna`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-rider-ordini"] });
      toast({
        title: "Ordine aggiornato",
        description: "L'ordine è stato marcato come in consegna",
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

  const marcaConsegnatoMutation = useMutation({
    mutationFn: async (ordineId: number) => {
      await api.put(`/delivery/ordini/${ordineId}/consegnato`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-rider-ordini"] });
      toast({
        title: "Ordine consegnato",
        description: "L'ordine è stato marcato come consegnato",
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

  const handleMarcaInConsegna = (ordineId: number) => {
    marcaInConsegnaMutation.mutate(ordineId);
  };

  const handleMarcaConsegnato = (ordineId: number) => {
    marcaConsegnatoMutation.mutate(ordineId);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ordini Assegnati</h1>
        <p className="text-gray-600 mt-2">
          Gestisci gli ordini assegnati per la consegna
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Ordini</CardTitle>
        </CardHeader>
        <CardContent>
          {ordini && ordini.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codice Ordine</TableHead>
                  <TableHead>Paziente</TableHead>
                  <TableHead>Indirizzo</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordini.map((ordine) => (
                  <TableRow key={ordine.id}>
                    <TableCell className="font-medium">#{ordine.id}</TableCell>
                    <TableCell>
                      {ordine.paziente
                        ? `${ordine.paziente.nome} ${ordine.paziente.cognome}`
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {ordine.indirizzoConsegna || "-"}
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">
                        {ordine.stato}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {ordine.stato === "assegnato" && (
                          <Button
                            size="sm"
                            onClick={() => handleMarcaInConsegna(ordine.id)}
                            disabled={marcaInConsegnaMutation.isPending}
                          >
                            Marca In Consegna
                          </Button>
                        )}
                        {ordine.stato === "in_consegna" && (
                          <Button
                            size="sm"
                            onClick={() => handleMarcaConsegnato(ordine.id)}
                            disabled={marcaConsegnatoMutation.isPending}
                          >
                            Marca Consegnato
                          </Button>
                        )}
                        <Link href={`/delivery/ordini/${ordine.id}`}>
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
    </div>
  );
}

