"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/shared/Loading";
import type { ApiResponse, Farmacia } from "@/types/api";
import { MapPin, Phone, Mail, Clock, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FarmaciePage() {
  const [raggioKm, setRaggioKm] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: farmacie, isLoading } = useQuery<Farmacia[]>({
    queryKey: ["paziente-farmacie-vicine", raggioKm],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Farmacia[]>>(
        `/paziente/farmacie/vicine?raggioKm=${raggioKm}&limit=50`
      );
      return response.data.data;
    },
  });

  const farmacieFiltrate = farmacie?.filter((farmacia) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (farmacia.nome?.toLowerCase() || '').includes(searchLower) ||
      (farmacia.citta?.toLowerCase() || '').includes(searchLower) ||
      (farmacia.indirizzo?.toLowerCase() || '').includes(searchLower)
    );
  }) || [];

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Farmacie Vicine</h1>
          <p className="text-gray-600 mt-2">
            Trova le farmacie più vicine a te
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Button>
        </Link>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri di Ricerca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Raggio di ricerca (km)
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                value={raggioKm}
                onChange={(e) => setRaggioKm(parseInt(e.target.value) || 10)}
                className="w-full"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Cerca per nome, città o indirizzo
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca farmacia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista Farmacie */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Farmacie Trovate ({farmacieFiltrate.length})
          </h2>
        </div>

        {farmacieFiltrate.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {farmacieFiltrate.map((farmacia) => (
              <Card key={farmacia.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{farmacia.nome}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">
                        {farmacia.indirizzo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {farmacia.cap} {farmacia.citta}
                        {farmacia.provincia && ` (${farmacia.provincia})`}
                      </p>
                    </div>
                  </div>

                  {farmacia.distanzaKm !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">
                        {farmacia.distanzaKm.toFixed(1)} km da te
                      </span>
                    </div>
                  )}

                  {farmacia.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a
                        href={`tel:${farmacia.telefono}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {farmacia.telefono}
                      </a>
                    </div>
                  )}

                  {farmacia.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a
                        href={`mailto:${farmacia.email}`}
                        className="text-sm text-blue-600 hover:text-blue-800 truncate"
                      >
                        {farmacia.email}
                      </a>
                    </div>
                  )}

                  {farmacia.orariApertura && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Orari:</p>
                        {typeof farmacia.orariApertura === "string" ? (
                          <p className="text-xs text-gray-700">
                            {farmacia.orariApertura}
                          </p>
                        ) : (
                          <div className="text-xs text-gray-700">
                            {Object.entries(farmacia.orariApertura).map(
                              ([giorno, orari]) => (
                                <p key={giorno}>
                                  {giorno}: {String(orari)}
                                </p>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Naviga alla creazione ordine con questa farmacia pre-selezionata
                        window.location.href = `/prescrizioni?farmaciaId=${farmacia.id}`;
                      }}
                    >
                      Seleziona Farmacia
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Nessuna farmacia trovata nel raggio di {raggioKm} km
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Prova ad aumentare il raggio di ricerca
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

