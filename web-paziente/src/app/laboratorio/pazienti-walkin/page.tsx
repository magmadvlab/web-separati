"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { UserPlus, Search, User, Phone, Mail, Calendar, Key, Eye } from "lucide-react";
import { motion } from "framer-motion";

interface PazienteWalkin {
  id: number;
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
  telefono?: string;
  email?: string;
  telegramUsername?: string;
  codiceAccesso: string;
  citta?: string;
  provincia?: string;
  createdAt: string;
  _count?: {
    prenotazioni: number;
  };
}

export default function PazientiWalkinPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    codiceFiscale: "",
    dataNascita: "",
    telefono: "",
    email: "",
    telegramUsername: "",
    indirizzo: "",
    citta: "",
    cap: "",
    provincia: "",
    note: "",
  });

  const { data: pazienti, isLoading } = useQuery<PazienteWalkin[]>({
    queryKey: ["pazienti-walkin", search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const response = await api.get<ApiResponse<PazienteWalkin[]>>(
        `/laboratori/dashboard/pazienti-walkin?${params.toString()}`
      );
      return response.data.data || [];
    },
  });

  const creaPazienteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post<ApiResponse<any>>(
        "/laboratori/dashboard/pazienti-walkin/cerca-o-crea",
        data
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pazienti-walkin"] });
      setDialogOpen(false);
      setFormData({
        nome: "",
        cognome: "",
        codiceFiscale: "",
        dataNascita: "",
        telefono: "",
        email: "",
        telegramUsername: "",
        indirizzo: "",
        citta: "",
        cap: "",
        provincia: "",
        note: "",
      });
      toast({
        title: data.message || "Paziente creato",
        description: `Codice accesso: ${data.pazienteWalkin?.codiceAccesso || data.paziente?.id}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante la creazione",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    creaPazienteMutation.mutate(formData);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-500/20 via-green-500/10 to-transparent p-6 border border-green-500/20"
      >
        <div className="absolute inset-0 shimmer opacity-30" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
              Pazienti Walk-in
            </h1>
            <p className="text-gray-600 mt-2">Gestisci i pazienti non registrati nel sistema</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="hover-lift">
                <UserPlus className="h-4 w-4 mr-2" />
                Nuovo Paziente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuovo Paziente Walk-in</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cognome">Cognome *</Label>
                    <Input
                      id="cognome"
                      value={formData.cognome}
                      onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codiceFiscale">Codice Fiscale *</Label>
                    <Input
                      id="codiceFiscale"
                      value={formData.codiceFiscale}
                      onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value.toUpperCase() })}
                      maxLength={16}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataNascita">Data di Nascita *</Label>
                    <Input
                      id="dataNascita"
                      type="date"
                      value={formData.dataNascita}
                      onChange={(e) => setFormData({ ...formData, dataNascita: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Telefono</Label>
                    <Input
                      id="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telegramUsername">Telegram Username</Label>
                    <Input
                      id="telegramUsername"
                      value={formData.telegramUsername}
                      onChange={(e) => setFormData({ ...formData, telegramUsername: e.target.value })}
                      placeholder="@username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="citta">Città</Label>
                    <Input
                      id="citta"
                      value={formData.citta}
                      onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Annulla
                  </Button>
                  <Button type="submit" disabled={creaPazienteMutation.isPending}>
                    {creaPazienteMutation.isPending ? "Creazione..." : "Crea Paziente"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Ricerca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca per nome, cognome, CF, telefono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista Pazienti */}
      {pazienti && pazienti.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {pazienti.map((paziente, index) => (
            <motion.div
              key={paziente.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover-lift cursor-pointer" onClick={() => router.push(`/laboratorio/pazienti-walkin/${paziente.id}`)}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">
                        {paziente.nome} {paziente.cognome}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>CF: {paziente.codiceFiscale}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(paziente.dataNascita).toLocaleDateString("it-IT")}</span>
                        </div>
                        {paziente.telefono && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{paziente.telefono}</span>
                          </div>
                        )}
                        {paziente.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>{paziente.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          <Key className="h-4 w-4 text-green-600" />
                          <span className="font-mono font-bold text-green-600">
                            {paziente.codiceAccesso}
                          </span>
                        </div>
                        {paziente._count && (
                          <div className="text-xs text-gray-500 mt-2">
                            {paziente._count.prenotazioni} prenotazioni
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="hover-lift">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-gray-500 font-medium">Nessun paziente walk-in trovato</p>
                <p className="text-sm text-gray-400 mt-1">
                  Crea un nuovo paziente per iniziare
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
