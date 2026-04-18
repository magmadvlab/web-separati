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
import type { ApiResponse, Ordine } from "@/types/api";
import { Search, Eye, Clock } from "lucide-react";
import Link from "next/link";

export default function OrdiniPage() {
  const [filtroStato, setFiltroStato] = useState<string>("tutte");
  const [ricerca, setRicerca] = useState<string>("");

  const { data: ordini, isLoading } = useQuery<Ordine[]>({
    queryKey: ["paziente-ordini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine[]>>("/paziente/ordini");
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  // ✅ Task 4.2.1: Filtri ordini
  const ordiniFiltrati = ordini?.filter((ordine) => {
    // Filtro stato
    if (filtroStato !== "tutte" && ordine.stato !== filtroStato) {
      return false;
    }

    // Ricerca
    if (ricerca) {
      const searchLower = ricerca.toLowerCase();
      const matchCodice = ((ordine as any).codiceOrdine || `#${ordine.id}`)
        .toLowerCase()
        .includes(searchLower);
      const matchFarmacia = ordine.farmacia?.nome?.toLowerCase().includes(searchLower);

      if (!matchCodice && !matchFarmacia) {
        return false;
      }
    }

    return true;
  }) || [];

  const getStatusColor = (stato: string) => {
    switch (stato.toLowerCase()) {
      case "consegnato":
        return "bg-green-100 text-green-800";
      case "in_consegna":
      case "in consegna":
        return "bg-blue-100 text-blue-800";
      case "assegnato_rider":
        return "bg-purple-100 text-purple-800";
      case "pronto":
        return "bg-yellow-100 text-yellow-800";
      case "in_preparazione":
      case "in preparazione":
        return "bg-orange-100 text-orange-800";
      case "creato":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (stato: string) => {
    const labels: Record<string, string> = {
      creato: "Creato",
      in_preparazione: "In Preparazione",
      pronto: "Pronto",
      assegnato_rider: "Assegnato al Rider",
      in_consegna: "In Consegna",
      consegnato: "Consegnato",
    };
    return labels[stato.toLowerCase()] || stato;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">I Miei Ordini</h1>
        <p className="text-gray-600 mt-2">Visualizza lo stato dei tuoi ordini</p>
      </div>

      {/* ✅ Task 4.2.1: Filtri */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca per codice ordine o farmacia..."
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
                  <SelectItem value="tutte">Tutti</SelectItem>
                  <SelectItem value="creato">Creato</SelectItem>
                  <SelectItem value="in_preparazione">In Preparazione</SelectItem>
                  <SelectItem value="pronto">Pronto</SelectItem>
                  <SelectItem value="assegnato_rider">Assegnato al Rider</SelectItem>
                  <SelectItem value="in_consegna">In Consegna</SelectItem>
                  <SelectItem value="consegnato">Consegnato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista Ordini ({ordiniFiltrati.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {ordiniFiltrati.length > 0 ? (
            <div className="space-y-3">
              {ordiniFiltrati.map((ordine) => (
                <Link key={ordine.id} href={`/ordini/${ordine.id}`} className="block">
                  <div className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">
                            {(ordine as any).codiceOrdine || `Ordine #${ordine.id}`}
                          </h3>
                          <span className={`rounded-full px-2 py-1 text-xs ${getStatusColor(ordine.stato)}`}>
                            {getStatusLabel(ordine.stato)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="text-xs text-gray-500">Data Creazione</p>
                            <p>{new Date(ordine.dataCreazione).toLocaleDateString("it-IT")}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Farmacia</p>
                            <p>{ordine.farmacia?.nome || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Importo</p>
                            <p className="font-medium">
                              €{Number((ordine as any).totale || ordine.importoTotale || 0).toFixed(2)}
                            </p>
                          </div>
                          {(ordine as any).dataConsegnaPrevista && (
                            <div>
                              <p className="text-xs text-gray-500">Consegna Prevista</p>
                              <p>{new Date((ordine as any).dataConsegnaPrevista).toLocaleDateString("it-IT")}</p>
                            </div>
                          )}
                        </div>
                        {/* ✅ Task 4.2.2: Tracking stato */}
                        {ordine.rider && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              Rider: {ordine.rider.nome} {ordine.rider.cognome}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Dettagli
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-600">Nessun ordine trovato</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

