"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { Save, Key, RefreshCw, Copy, CheckCircle2, XCircle, Building2, MapPin, Settings, Shield, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LaboratorioProfile {
  id: number;
  nome: string;
  partitaIva: string;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
  telefono?: string;
  email?: string;
  latitudine?: number;
  longitudine?: number;
  convenzionato: boolean;
  scontoPercentuale?: number;
  apiEndpoint?: string;
  dashboardAttiva: boolean;
  dashboardUrl?: string;
  apiChiamateOggi: number;
  apiLimiteGiornaliero: number;
  apiKeyAttiva: boolean;
  apiKey?: string;
  apiKeyGenerataIl?: string;
  accettaPrenotazioniOnline?: boolean;
  contattoFallback?: string;
  stato: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfiloPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    partitaIva: "",
    indirizzo: "",
    citta: "",
    cap: "",
    provincia: "",
    telefono: "",
    email: "",
    latitudine: "",
    longitudine: "",
    convenzionato: false,
    scontoPercentuale: "",
    apiEndpoint: "",
    dashboardAttiva: false,
    dashboardUrl: "",
    apiLimiteGiornaliero: "",
    accettaPrenotazioniOnline: true,
    contattoFallback: "",
  });
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const { data: profile, isLoading } = useQuery<LaboratorioProfile>({
    queryKey: ["laboratorio-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<LaboratorioProfile>>("/laboratori/dashboard/profile");
      return response.data.data;
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || "",
        partitaIva: profile.partitaIva || "",
        indirizzo: profile.indirizzo || "",
        citta: profile.citta || "",
        cap: profile.cap || "",
        provincia: profile.provincia || "",
        telefono: profile.telefono || "",
        email: profile.email || "",
        latitudine: profile.latitudine?.toString() || "",
        longitudine: profile.longitudine?.toString() || "",
        convenzionato: profile.convenzionato || false,
        scontoPercentuale: profile.scontoPercentuale?.toString() || "",
        apiEndpoint: profile.apiEndpoint || "",
        dashboardAttiva: profile.dashboardAttiva || false,
        dashboardUrl: profile.dashboardUrl || "",
        apiLimiteGiornaliero: profile.apiLimiteGiornaliero?.toString() || "",
        accettaPrenotazioniOnline: profile.accettaPrenotazioniOnline !== false,
        contattoFallback: profile.contattoFallback || "",
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put<ApiResponse<LaboratorioProfile>>("/laboratori/dashboard/profile", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laboratorio-profile"] });
      toast({
        title: "Profilo aggiornato",
        description: "Il profilo è stato aggiornato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    },
  });

  const generateApiKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<{ apiKey: string; apiKeyAttiva: boolean; apiKeyGenerataIl: string }>>(
        "/laboratori/dashboard/api-key/generate"
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      setNewApiKey(data.apiKey);
      queryClient.invalidateQueries({ queryKey: ["laboratorio-profile"] });
      toast({
        title: "API Key generata",
        description: "Salva questa chiave in un luogo sicuro, non sarà più visualizzabile",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante la generazione",
        variant: "destructive",
      });
    },
  });

  const resetApiKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post<ApiResponse<{ apiKey: string; apiKeyAttiva: boolean; apiKeyGenerataIl: string }>>(
        "/laboratori/dashboard/api-key/reset"
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      setNewApiKey(data.apiKey);
      queryClient.invalidateQueries({ queryKey: ["laboratorio-profile"] });
      toast({
        title: "API Key resettata",
        description: "La vecchia chiave è stata disattivata. Salva questa nuova chiave in un luogo sicuro",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante il reset",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {};

    // Aggiungi solo i campi che sono stati modificati
    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof typeof formData];
      if (value !== "" && value !== null && value !== undefined) {
        if (key === "convenzionato" || key === "dashboardAttiva" || key === "accettaPrenotazioniOnline") {
          data[key] = value;
        } else if (key === "scontoPercentuale" || key === "latitudine" || key === "longitudine" || key === "apiLimiteGiornaliero") {
          const numValue = parseFloat(value as string);
          if (!isNaN(numValue)) {
            data[key] = numValue;
          }
        } else {
          data[key] = value;
        }
      }
    });
    // contattoFallback può essere stringa vuota (per cancellarlo)
    data.contattoFallback = formData.contattoFallback || null;

    updateProfileMutation.mutate(data);
  };

  const handleCopyApiKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
    }
  };

  const maskApiKey = (apiKey?: string) => {
    if (!apiKey) return "Non configurata";
    if (apiKey.length <= 8) return "••••••••";
    return `••••••••${apiKey.slice(-4)}`;
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent p-6 border border-blue-500/20"
      >
        <div className="absolute inset-0 shimmer opacity-30" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Profilo Laboratorio
          </h1>
          <p className="text-gray-600 mt-2">Gestisci le informazioni del tuo laboratorio</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dati Anagrafici */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dati Anagrafici
            </CardTitle>
            <CardDescription>Informazioni principali del laboratorio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Laboratorio *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partitaIva">Partita IVA *</Label>
                <Input
                  id="partitaIva"
                  value={formData.partitaIva}
                  onChange={(e) => setFormData({ ...formData, partitaIva: e.target.value })}
                  pattern="[0-9]{11}"
                  maxLength={11}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="indirizzo">Indirizzo *</Label>
                <Input
                  id="indirizzo"
                  value={formData.indirizzo}
                  onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="citta">Città *</Label>
                <Input
                  id="citta"
                  value={formData.citta}
                  onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cap">CAP *</Label>
                <Input
                  id="cap"
                  value={formData.cap}
                  onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                  pattern="[0-9]{5}"
                  maxLength={5}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia *</Label>
                <Input
                  id="provincia"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value.toUpperCase() })}
                  maxLength={2}
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
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Geolocalizzazione */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geolocalizzazione
            </CardTitle>
            <CardDescription>Coordinate GPS per la ricerca</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitudine">Latitudine</Label>
                <Input
                  id="latitudine"
                  type="number"
                  step="0.00000001"
                  min="-90"
                  max="90"
                  value={formData.latitudine}
                  onChange={(e) => setFormData({ ...formData, latitudine: e.target.value })}
                  placeholder="Es. 41.9028"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitudine">Longitudine</Label>
                <Input
                  id="longitudine"
                  type="number"
                  step="0.00000001"
                  min="-180"
                  max="180"
                  value={formData.longitudine}
                  onChange={(e) => setFormData({ ...formData, longitudine: e.target.value })}
                  placeholder="Es. 12.4964"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Accordi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Accordi e Convenzioni
            </CardTitle>
            <CardDescription>Configurazione accordi con SSN</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="convenzionato"
                checked={formData.convenzionato}
                onCheckedChange={(checked) => setFormData({ ...formData, convenzionato: checked === true })}
              />
              <Label htmlFor="convenzionato" className="cursor-pointer">
                Convenzionato SSN
              </Label>
            </div>
            {formData.convenzionato && (
              <div className="space-y-2">
                <Label htmlFor="scontoPercentuale">Sconto Percentuale (%)</Label>
                <Input
                  id="scontoPercentuale"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.scontoPercentuale}
                  onChange={(e) => setFormData({ ...formData, scontoPercentuale: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        {/* API Integration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="glass border-white/20 hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Integrazione API
            </CardTitle>
            <CardDescription>Gestione API Key e configurazione dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={maskApiKey(profile?.apiKey)}
                  readOnly
                  className="font-mono"
                />
                <Badge variant={profile?.apiKeyAttiva ? "default" : "secondary"}>
                  {profile?.apiKeyAttiva ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Attiva
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Non attiva
                    </>
                  )}
                </Badge>
              </div>
              {profile?.apiKeyGenerataIl && (
                <p className="text-xs text-gray-500">
                  Generata il: {new Date(profile.apiKeyGenerataIl).toLocaleDateString("it-IT")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => generateApiKeyMutation.mutate()}
                disabled={generateApiKeyMutation.isPending}
              >
                <Key className="h-4 w-4 mr-2" />
                {profile?.apiKeyAttiva ? "Rigenera API Key" : "Genera API Key"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => resetApiKeyMutation.mutate()}
                disabled={resetApiKeyMutation.isPending || !profile?.apiKeyAttiva}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset API Key
              </Button>
            </div>
            {newApiKey && (
              <Dialog open={!!newApiKey} onOpenChange={() => setNewApiKey(null)}>
                <DialogContent className="glass border-white/20">
                  <DialogHeader>
                    <DialogTitle>Nuova API Key Generata</DialogTitle>
                    <DialogDescription>
                      Salva questa chiave in un luogo sicuro. Non sarà più visualizzabile dopo la chiusura di questo dialogo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input value={newApiKey} readOnly className="font-mono" />
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopyApiKey}
                          className="hover-lift"
                        >
                        {apiKeyCopied ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Copiata
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copia
                          </>
                        )}
                        </Button>
                      </motion.div>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setNewApiKey(null)}
                      className="w-full"
                    >
                      Ho salvato la chiave
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            <div className="space-y-2">
              <Label htmlFor="apiEndpoint">API Endpoint</Label>
              <Input
                id="apiEndpoint"
                value={formData.apiEndpoint}
                onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                placeholder="https://api.laboratorio.it"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dashboardAttiva"
                checked={formData.dashboardAttiva}
                onCheckedChange={(checked) => setFormData({ ...formData, dashboardAttiva: checked === true })}
              />
              <Label htmlFor="dashboardAttiva" className="cursor-pointer">
                Dashboard Attiva
              </Label>
            </div>
            {formData.dashboardAttiva && (
              <div className="space-y-2">
                <Label htmlFor="dashboardUrl">Dashboard URL</Label>
                <Input
                  id="dashboardUrl"
                  value={formData.dashboardUrl}
                  onChange={(e) => setFormData({ ...formData, dashboardUrl: e.target.value })}
                  placeholder="https://dashboard.laboratorio.it"
                />
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        {/* Rate Limiting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Rate Limiting
            </CardTitle>
            <CardDescription>Configurazione limiti chiamate API</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiLimiteGiornaliero">Limite Chiamate Giornaliero</Label>
              <Input
                id="apiLimiteGiornaliero"
                type="number"
                min="1"
                value={formData.apiLimiteGiornaliero}
                onChange={(e) => setFormData({ ...formData, apiLimiteGiornaliero: e.target.value })}
              />
            </div>
            {profile && (
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600">
                  Chiamate oggi: <span className="font-semibold">{profile.apiChiamateOggi}</span> / {profile.apiLimiteGiornaliero}
                </p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((profile.apiChiamateOggi / profile.apiLimiteGiornaliero) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        </motion.div>

        {/* Prenotazioni online */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        >
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Prenotazioni Online
              </CardTitle>
              <CardDescription>Gestisci se i pazienti possono prenotare online</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                <div>
                  <p className="font-medium">Accetta prenotazioni online</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Se disattivato, i pazienti vedranno solo i tuoi contatti diretti
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.accettaPrenotazioniOnline}
                  onClick={() =>
                    setFormData({ ...formData, accettaPrenotazioniOnline: !formData.accettaPrenotazioniOnline })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    formData.accettaPrenotazioniOnline ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      formData.accettaPrenotazioniOnline ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {!formData.accettaPrenotazioniOnline && (
                <div className="space-y-2">
                  <Label htmlFor="contattoFallback">Contatto diretto per i pazienti</Label>
                  <Input
                    id="contattoFallback"
                    value={formData.contattoFallback}
                    onChange={(e) => setFormData({ ...formData, contattoFallback: e.target.value })}
                    placeholder="Es. +39 02 1234567 oppure prenotazioni@laboratorio.it"
                  />
                  <p className="text-xs text-muted-foreground">
                    Questo numero/email verrà mostrato ai pazienti per prenotare direttamente
                  </p>
                </div>
              )}

              <div
                className={`rounded-lg p-3 text-sm ${
                  formData.accettaPrenotazioniOnline
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {formData.accettaPrenotazioniOnline
                  ? "✅ I pazienti possono prenotare online tramite il calendario"
                  : "⚠️ I pazienti vedranno solo i contatti diretti — nessun calendario online"}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pulsante Salva */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex justify-end"
        >
          <Button type="submit" disabled={updateProfileMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateProfileMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

