"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import type { ApiResponse } from "@/types/api";
import { Search, MapPin, Phone, Mail, Building2, ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Farmacia {
  id: number;
  nome: string;
  partitaIva: string;
  codiceFarmacia?: string;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  telefono?: string;
  email: string;
  stato: string;
  farmacisti?: Array<{ id: number; nome: string; cognome: string }>;
  _count?: { ordini: number };
}

export default function AdminFarmaciePage() {
  const [search, setSearch] = useState("");
  const [stato, setStato] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-farmacie", search, stato, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (stato && stato !== "all") params.append("stato", stato);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await api.get<ApiResponse<{
        data: Farmacia[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>>(`/admin/farmacie?${params.toString()}`);
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const farmacie = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gestione Farmacie</h1>
            <p className="text-gray-600 mt-2">
              Visualizza e gestisci tutte le farmacie del sistema
            </p>
          </div>
        </div>
      </div>

      {/* Filtri */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca per nome, partita IVA, città..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={stato} onValueChange={(value) => {
              setStato(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tutti gli stati" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="attiva">Attiva</SelectItem>
                <SelectItem value="sospesa">Sospesa</SelectItem>
                <SelectItem value="chiusa">Chiusa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistiche */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Farmacie</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">Farmacie registrate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Farmacie Attive</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {farmacie.filter(f => f.stato === "attiva").length}
            </div>
            <p className="text-xs text-muted-foreground">In attività</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Farmacisti Totali</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {farmacie.reduce((acc, f) => acc + (f.farmacisti?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Farmacisti registrati</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista Farmacie */}
      {farmacie.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {farmacie.map((farmacia) => (
            <Card key={farmacia.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{farmacia.nome}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">P.IVA: {farmacia.partitaIva}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      farmacia.stato === "attiva"
                        ? "bg-green-100 text-green-800 border-green-300"
                        : farmacia.stato === "sospesa"
                        ? "bg-orange-100 text-orange-800 border-orange-300"
                        : "bg-gray-100 text-gray-800 border-gray-300"
                    }
                  >
                    {farmacia.stato}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {farmacia.indirizzo}, {farmacia.cap} {farmacia.citta} ({farmacia.provincia})
                    </span>
                  </div>
                  {farmacia.telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${farmacia.telefono}`} className="hover:text-blue-600">
                        {farmacia.telefono}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${farmacia.email}`} className="hover:text-blue-600 truncate">
                      {farmacia.email}
                    </a>
                  </div>
                  {farmacia.farmacisti && farmacia.farmacisti.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {farmacia.farmacisti.length} farmacista{farmacia.farmacisti.length !== 1 ? 'i' : ''}
                      </span>
                    </div>
                  )}
                  {farmacia._count && (
                    <div className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">{farmacia._count.ordini}</span> ordini totali
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">
              Nessuna farmacia trovata
            </p>
            <p className="text-sm text-gray-500">
              {search || stato ? "Prova a modificare i filtri di ricerca" : "Non ci sono farmacie registrate"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Paginazione */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Pagina {pagination.page} di {pagination.totalPages} ({pagination.total} farmacie)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Successiva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
