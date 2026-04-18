"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/shared/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApiResponse, Prescrizione } from "@/types/api";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";

export default function MedicoPrescrizioniPage() {
  const [filtroStato, setFiltroStato] = useState<string>("tutte");
  const [ricerca, setRicerca] = useState<string>("");

  const { data: prescrizioni, isLoading } = useQuery<Prescrizione[]>({
    queryKey: ["medico-prescrizioni"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prescrizione[]>>("/medico/prescrizioni");
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const prescrizioniFiltrate = prescrizioni?.filter((prescrizione) => {
    if (filtroStato !== "tutte" && prescrizione.stato !== filtroStato) {
      return false;
    }
    if (ricerca) {
      const searchLower = ricerca.toLowerCase();
      const matchPaziente = prescrizione.paziente?.nome?.toLowerCase().includes(searchLower) ||
        prescrizione.paziente?.cognome?.toLowerCase().includes(searchLower);
      return matchPaziente;
    }
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Prescrizioni</h1>
        <Link href="/medico/prescrizioni/nuova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuova Prescrizione
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lista Prescrizioni</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Cerca per paziente..."
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select value={filtroStato} onValueChange={setFiltroStato}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutte">Tutte</SelectItem>
                  <SelectItem value="attiva">Attive</SelectItem>
                  <SelectItem value="scaduta">Scadute</SelectItem>
                  <SelectItem value="utilizzata">Utilizzate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {prescrizioniFiltrate.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nessuna prescrizione trovata
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Paziente</TableHead>
                  <TableHead>Data Emissione</TableHead>
                  <TableHead>Data Validità</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescrizioniFiltrate.map((prescrizione) => (
                  <TableRow key={prescrizione.id}>
                    <TableCell>#{prescrizione.id}</TableCell>
                    <TableCell>
                      {prescrizione.paziente?.nome} {prescrizione.paziente?.cognome}
                    </TableCell>
                    <TableCell>
                      {new Date(prescrizione.dataEmissione).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {prescrizione.dataValidita 
                        ? new Date(prescrizione.dataValidita).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${
                        prescrizione.stato === "attiva" ? "bg-green-100 text-green-800" :
                        prescrizione.stato === "scaduta" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {prescrizione.stato}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/medico/prescrizioni/${prescrizione.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
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

