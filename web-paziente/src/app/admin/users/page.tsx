"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { ApiResponse } from "@/types/api";
import { } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const [ricerca, setRicerca] = useState<string>("");
  const [filtroRuolo, setFiltroRuolo] = useState<string>("tutti");

  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/admin/users");
      return response.data.data || [];
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const usersFiltrati = users?.filter((user) => {
    if (filtroRuolo !== "tutti" && user.ruolo !== filtroRuolo) {
      return false;
    }
    if (ricerca) {
      const searchLower = ricerca.toLowerCase();
      const matchUsername = user.username?.toLowerCase().includes(searchLower);
      const matchEmail = user.email?.toLowerCase().includes(searchLower);
      return matchUsername || matchEmail;
    }
    return true;
  }) || [];

  const getRuoloBadge = (ruolo: string) => {
    const colors: Record<string, string> = {
      admin: "bg-purple-100 text-purple-800",
      medico: "bg-blue-100 text-blue-800",
      farmacista: "bg-green-100 text-green-800",
      rider: "bg-orange-100 text-orange-800",
      paziente: "bg-gray-100 text-gray-800",
    };
    return colors[ruolo] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gestione Utenti</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lista Utenti</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Cerca utente..."
                value={ricerca}
                onChange={(e) => setRicerca(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select value={filtroRuolo} onValueChange={setFiltroRuolo}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtra per ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="medico">Medico</SelectItem>
                  <SelectItem value="farmacista">Farmacista</SelectItem>
                  <SelectItem value="rider">Rider</SelectItem>
                  <SelectItem value="paziente">Paziente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {usersFiltrati.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nessun utente trovato
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersFiltrati.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email || user.emailDedicata || "N/A"}</TableCell>
                    <TableCell>
                      <Badge className={getRuoloBadge(user.ruolo)}>
                        {user.ruolo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.stato === "attivo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {user.stato || "attivo"}
                      </Badge>
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

