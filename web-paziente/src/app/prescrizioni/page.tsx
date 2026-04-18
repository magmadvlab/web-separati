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
import type { ApiResponse, Prescrizione } from "@/types/api";
import { Search, Eye, ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function PrescrizioniPage() {
  const [filtroStato, setFiltroStato] = useState<string>("tutte");
  const [ricerca, setRicerca] = useState<string>("");

  const { data: prescrizioni, isLoading } = useQuery<Prescrizione[]>({
    queryKey: ["paziente-prescrizioni"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prescrizione[]>>("/paziente/prescrizioni");
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  // ✅ Task 2.2.1 e 2.2.2: Filtri e ricerca
  const prescrizioniFiltrate = prescrizioni?.filter((prescrizione) => {
    // Filtro stato
    if (filtroStato !== "tutte") {
      if (filtroStato === "attive") {
        const isAttiva = prescrizione.stato === "attiva" && prescrizione.dataScadenza
          ? new Date(prescrizione.dataScadenza) >= new Date()
          : prescrizione.stato === "attiva";
        if (!isAttiva) return false;
      } else if (filtroStato === "scadute") {
        const isScaduta = prescrizione.dataScadenza
          ? new Date(prescrizione.dataScadenza) < new Date()
          : false;
        if (!isScaduta) return false;
      } else if (prescrizione.stato !== filtroStato) {
        return false;
      }
    }

    // Ricerca
    if (ricerca) {
      const searchLower = ricerca.toLowerCase();
      const matchNumeroRicetta = prescrizione.numeroRicetta?.toLowerCase().includes(searchLower);
      const matchNre = prescrizione.codiceNre?.toLowerCase().includes(searchLower);
      const matchMedico = prescrizione.medico
        ? `${prescrizione.medico.nome} ${prescrizione.medico.cognome}`.toLowerCase().includes(searchLower)
        : false;
      
      if (!matchNumeroRicetta && !matchNre && !matchMedico) {
        return false;
      }
    }

    return true;
  }) || [];

  const getStatusColor = (stato: string) => {
    switch (stato.toLowerCase()) {
      case "attiva":
        return "bg-green-100 text-green-800";
      case "scaduta":
        return "bg-red-100 text-red-800";
      case "utilizzata":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const isAttiva = (prescrizione: Prescrizione) => {
    return prescrizione.stato === "attiva" && prescrizione.dataScadenza
      ? new Date(prescrizione.dataScadenza) >= new Date()
      : prescrizione.stato === "attiva";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Le Mie Prescrizioni</h1>
        <p className="text-gray-600 mt-2">
          Visualizza tutte le tue prescrizioni mediche
        </p>
      </div>

      {/* ✅ Task 2.2.1 e 2.2.2: Filtri e ricerca */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca per numero ricetta, NRE o medico..."
                  value={ricerca}
                  onChange={(e) => setRicerca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={filtroStato} onValueChange={setFiltroStato}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtra per stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutte">Tutte</SelectItem>
                  <SelectItem value="attive">Attive</SelectItem>
                  <SelectItem value="scadute">Scadute</SelectItem>
                  <SelectItem value="utilizzata">Utilizzate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Lista Prescrizioni ({prescrizioniFiltrate.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {prescrizioniFiltrate.length > 0 ? (
            <div className="space-y-3">
              {prescrizioniFiltrate.map((prescrizione) => (
                <div
                  key={prescrizione.id}
                  className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">
                          {prescrizione.numeroRicetta
                            ? `Ricetta N. ${prescrizione.numeroRicetta}`
                            : `Prescrizione #${prescrizione.id}`}
                        </h3>
                        <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(prescrizione.stato)}`}>
                          {prescrizione.stato}
                        </span>
                        {prescrizione.codiceNre && (
                          <span className="text-xs text-gray-500 font-mono">
                            NRE: {prescrizione.codiceNre}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <p className="text-xs text-gray-500">Data Emissione</p>
                          <p>
                            {new Date(prescrizione.dataEmissione).toLocaleDateString("it-IT")}
                          </p>
                        </div>
                        {prescrizione.dataScadenza && (
                          <div>
                            <p className="text-xs text-gray-500">Validità</p>
                            <p>
                              {new Date(prescrizione.dataScadenza).toLocaleDateString("it-IT")}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Medico</p>
                          <p>
                            {prescrizione.medico
                              ? `Dr. ${prescrizione.medico.nome} ${prescrizione.medico.cognome}`
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Farmaci</p>
                          <p>
                            {Array.isArray(prescrizione.farmaci)
                              ? `${prescrizione.farmaci.length} farmaco/i`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Link href={`/prescrizioni/${prescrizione.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Dettagli
                        </Button>
                      </Link>
                      {isAttiva(prescrizione) && (
                        <Link href={`/prescrizioni/${prescrizione.id}/nuovo-ordine`}>
                          <Button size="sm">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Ordine
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-600">
              Nessuna prescrizione trovata
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

