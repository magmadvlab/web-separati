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
import type { ApiResponse, Farmaco } from "@/types/api";

const formatPrezzo = (prezzo?: number | string | null) => {
  if (prezzo === undefined || prezzo === null) {
    return "-";
  }

  const value = typeof prezzo === "number" ? prezzo : Number(prezzo);

  if (Number.isNaN(value)) {
    return "-";
  }

  return `€${value.toFixed(2)}`;
};

export default function CatalogoPage() {
  const { data: catalogo, isLoading } = useQuery<Farmaco[]>({
    queryKey: ["farmacia-catalogo"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Farmaco[]>>("/farmacia/catalogo");
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Catalogo Farmaci</h1>
        <p className="text-gray-600 mt-2">
          Visualizza i farmaci disponibili
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista Farmaci</CardTitle>
        </CardHeader>
        <CardContent>
          {catalogo && catalogo.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Principio Attivo</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead>Prezzo</TableHead>
                  <TableHead>Disponibile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalogo.map((farmaco) => (
                  <TableRow key={farmaco.id}>
                    <TableCell className="font-medium">{farmaco.nome}</TableCell>
                    <TableCell>{farmaco.principioAttivo || "-"}</TableCell>
                    <TableCell>{farmaco.formaFarmaceutica || "-"}</TableCell>
                    <TableCell>{formatPrezzo(farmaco.prezzo)}</TableCell>
                    <TableCell>
                      {farmaco.disponibile ? (
                        <span className="text-green-600">Sì</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-8 text-gray-600">
              Nessun farmaco trovato
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

