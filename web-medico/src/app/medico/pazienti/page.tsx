"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import type { ApiResponse } from "@/types/api";
import { Search, User, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function MedicoPazientiPage() {
  const [ricerca, setRicerca] = useState<string>("");
  const [includeSenzaMedico, setIncludeSenzaMedico] = useState<boolean>(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pazienti, isLoading } = useQuery<any[]>({
    queryKey: ["medico-pazienti", includeSenzaMedico],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>(
        `/medico/pazienti?includeSenzaMedico=${includeSenzaMedico}`
      );
      return response.data.data;
    },
  });

  const associaMutation = useMutation({
    mutationFn: async (pazienteId: number) => {
      const response = await api.post<ApiResponse<any>>(
        `/medico/pazienti/${pazienteId}/associa`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medico-pazienti"] });
      toast({
        title: "Paziente associato",
        description: "Il paziente è stato associato con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore durante l'associazione del paziente.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const pazientiFiltrati = pazienti?.filter((paziente) => {
    if (ricerca) {
      const searchLower = ricerca.toLowerCase();
      const matchNome = paziente.nome?.toLowerCase().includes(searchLower);
      const matchCognome = paziente.cognome?.toLowerCase().includes(searchLower);
      const matchCF = paziente.codiceFiscale?.toLowerCase().includes(searchLower);
      return matchNome || matchCognome || matchCF;
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pazienti</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lista Pazienti</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={includeSenzaMedico ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeSenzaMedico(!includeSenzaMedico)}
              >
                {includeSenzaMedico ? "Mostra solo associati" : "Mostra tutti"}
              </Button>
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca paziente..."
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                className="w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pazientiFiltrati.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nessun paziente trovato
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cognome</TableHead>
                  <TableHead>Codice Fiscale</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Medico</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pazientiFiltrati.map((paziente) => (
                  <TableRow key={paziente.id}>
                    <TableCell>{paziente.nome}</TableCell>
                    <TableCell>{paziente.cognome}</TableCell>
                    <TableCell>{paziente.codiceFiscale}</TableCell>
                    <TableCell>{paziente.utente?.emailDedicata || "-"}</TableCell>
                    <TableCell>{paziente.telefono || "-"}</TableCell>
                    <TableCell>
                      {paziente.medicoCurante ? (
                        <Badge variant="default">
                          {paziente.medicoCurante.nome} {paziente.medicoCurante.cognome}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Nessun medico</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!paziente.medicoCurante && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => associaMutation.mutate(paziente.id)}
                          disabled={associaMutation.isPending}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Associa
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

