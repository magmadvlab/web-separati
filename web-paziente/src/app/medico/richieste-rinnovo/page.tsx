"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { ApiResponse, RichiestaRinnovoPrescrizione } from "@/types/api";
import { Clock, CheckCircle2, XCircle, Eye } from "lucide-react";
import Link from "next/link";

export default function MedicoRichiesteRinnovoPage() {
  const [filtroStato, setFiltroStato] = useState<string>("tutte");
  const [ricerca, setRicerca] = useState<string>("");

  const { data: richieste, isLoading } = useQuery<RichiestaRinnovoPrescrizione[]>({
    queryKey: ["medico-richieste-rinnovo", filtroStato],
    queryFn: async () => {
      const params = filtroStato !== "tutte" ? `?stato=${filtroStato}` : "";
      const response = await api.get<ApiResponse<RichiestaRinnovoPrescrizione[]>>(
        `/medico/richieste-rinnovo${params}`
      );
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const richiesteFiltrate = richieste?.filter((richiesta) => {
    if (ricerca) {
      const searchLower = ricerca.toLowerCase();
      const matchPaziente =
        richiesta.paziente?.nome?.toLowerCase().includes(searchLower) ||
        richiesta.paziente?.cognome?.toLowerCase().includes(searchLower) ||
        richiesta.paziente?.codiceFiscale?.toLowerCase().includes(searchLower);
      const matchFarmaco = richiesta.terapia?.farmaco?.nomeCommerciale
        ?.toLowerCase()
        .includes(searchLower);
      return matchPaziente || matchFarmaco;
    }
    return true;
  }) || [];

  const getStatusBadge = (stato: string) => {
    switch (stato) {
      case "in_attesa":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            In Attesa
          </Badge>
        );
      case "approvata":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approvata
          </Badge>
        );
      case "rifiutata":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rifiutata
          </Badge>
        );
      default:
        return <Badge variant="outline">{stato}</Badge>;
    }
  };

  const richiesteInAttesa = richieste?.filter((r) => r.stato === "in_attesa").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Richieste Rinnovo Prescrizione</h1>
          <p className="text-gray-600 mt-1">
            Gestisci le richieste di rinnovo prescrizione dai tuoi pazienti
          </p>
        </div>
        {richiesteInAttesa > 0 && (
          <Badge className="bg-yellow-500 text-white text-lg px-4 py-2">
            {richiesteInAttesa} in attesa
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lista Richieste Rinnovo</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Cerca per paziente o farmaco..."
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
                  <SelectItem value="in_attesa">In Attesa</SelectItem>
                  <SelectItem value="approvata">Approvate</SelectItem>
                  <SelectItem value="rifiutata">Rifiutate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {richiesteFiltrate.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nessuna richiesta trovata
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Paziente</TableHead>
                  <TableHead>Farmaco</TableHead>
                  <TableHead>Giorni Rimanenti</TableHead>
                  <TableHead>Data Richiesta</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {richiesteFiltrate.map((richiesta) => (
                  <TableRow key={richiesta.id}>
                    <TableCell>#{richiesta.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {richiesta.paziente?.nome} {richiesta.paziente?.cognome}
                        </p>
                        {richiesta.paziente?.codiceFiscale && (
                          <p className="text-xs text-gray-500">
                            {richiesta.paziente.codiceFiscale}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {richiesta.terapia?.farmaco?.nomeCommerciale || "N/A"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          richiesta.giorniRimanenti <= 7
                            ? "text-red-600 font-semibold"
                            : richiesta.giorniRimanenti <= 14
                            ? "text-yellow-600 font-semibold"
                            : ""
                        }
                      >
                        {richiesta.giorniRimanenti} giorni
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(richiesta.dataRichiesta).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(richiesta.stato)}</TableCell>
                    <TableCell>
                      <Link href={`/medico/richieste-rinnovo/${richiesta.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Dettagli
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

