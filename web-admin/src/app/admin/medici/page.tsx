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
import { Search, User, Mail, Phone, GraduationCap, ArrowLeft, Users, FileText } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Medico {
  id: number;
  nome: string;
  cognome: string;
  codiceRegionale: string;
  specializzazione: string;
  email?: string;
  telefono?: string;
  utente?: {
    id: number;
    username: string;
    emailDedicata: string;
    stato: string;
  };
  _count?: {
    pazienti: number;
    prescrizioni: number;
  };
}

export default function AdminMediciPage() {
  const [search, setSearch] = useState("");
  const [specializzazione, setSpecializzazione] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-medici", search, specializzazione, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (specializzazione && specializzazione !== "all") params.append("specializzazione", specializzazione);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await api.get<ApiResponse<{
        data: Medico[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>>(`/admin/medici?${params.toString()}`);
      return response.data.data;
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const medici = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  // Estrai specializzazioni uniche per il filtro
  const specializzazioniUniche = Array.from(
    new Set(medici.map((m) => m.specializzazione).filter(Boolean))
  ).sort();

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
            <h1 className="text-3xl font-bold">Gestione Medici</h1>
            <p className="text-gray-600 mt-2">
              Visualizza e gestisci tutti i medici del sistema
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
                  placeholder="Cerca per nome, cognome, codice regionale, email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={specializzazione} onValueChange={(value) => {
              setSpecializzazione(value);
              setPage(1);
            }}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Tutte le specializzazioni" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le specializzazioni</SelectItem>
                {specializzazioniUniche.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistiche */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale Medici</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">Medici registrati</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pazienti Totali</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {medici.reduce((acc, m) => acc + (m._count?.pazienti || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Pazienti associati</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescrizioni Totali</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {medici.reduce((acc, m) => acc + (m._count?.prescrizioni || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Prescrizioni emesse</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista Medici */}
      {medici.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {medici.map((medico) => (
            <Card key={medico.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      Dr. {medico.nome} {medico.cognome}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Cod. Reg.: {medico.codiceRegionale}
                    </p>
                  </div>
                  {medico.utente?.stato && (
                    <Badge
                      variant="outline"
                      className={
                        medico.utente.stato === "attivo"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : "bg-gray-100 text-gray-800 border-gray-300"
                      }
                    >
                      {medico.utente.stato}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {medico.specializzazione && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4" />
                      <span className="font-medium">{medico.specializzazione}</span>
                    </div>
                  )}
                  {medico.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${medico.email}`} className="hover:text-blue-600 truncate">
                        {medico.email}
                      </a>
                    </div>
                  )}
                  {medico.telefono && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${medico.telefono}`} className="hover:text-blue-600">
                        {medico.telefono}
                      </a>
                    </div>
                  )}
                  {medico.utente && (
                    <div className="text-sm text-gray-500 mt-2 pt-2 border-t">
                      <p>Username: {medico.utente.username}</p>
                      <p>Email: {medico.utente.emailDedicata}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                    {medico._count && (
                      <>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{medico._count.pazienti || 0}</span>
                          <span className="text-xs">pazienti</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{medico._count.prescrizioni || 0}</span>
                          <span className="text-xs">prescrizioni</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">
              Nessun medico trovato
            </p>
            <p className="text-sm text-gray-500">
              {search || specializzazione ? "Prova a modificare i filtri di ricerca" : "Non ci sono medici registrati"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Paginazione */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Pagina {pagination.page} di {pagination.totalPages} ({pagination.total} medici)
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
