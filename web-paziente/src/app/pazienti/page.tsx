"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loading } from "@/components/shared/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApiResponse, Paziente } from "@/types/api";
import { useAuthStore } from "@/stores/auth-store";

export default function PazientiPage() {
  const { user } = useAuthStore();
  
  const { data: pazienti, isLoading } = useQuery<Paziente[]>({
    queryKey: ["medico-pazienti"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Paziente[]>>("/medico/pazienti");
      return response.data.data;
    },
    enabled: !!user && user.ruolo === "medico",
    retry: false,
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pazienti Associati</h1>
        <p className="text-gray-600 mt-2">
          Visualizza i tuoi pazienti in cura
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Pazienti</CardTitle>
        </CardHeader>
        <CardContent>
          {pazienti && pazienti.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Codice Fiscale</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Città</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pazienti.map((paziente) => (
                  <TableRow key={paziente.id}>
                    <TableCell>
                      {paziente.nome} {paziente.cognome}
                    </TableCell>
                    <TableCell>{paziente.codiceFiscale}</TableCell>
                    <TableCell>{paziente.telefono || "-"}</TableCell>
                    <TableCell>{paziente.citta}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-gray-600">
              Nessun paziente trovato
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

