"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import type { ApiResponse, Paziente, Ordine, Prescrizione } from "@/types/api";
import {
  User,
  FileText,
  ShoppingCart,
  Pill,
  Calendar,
  ArrowRight,
  Activity,
  Heart,
  TrendingUp,
  Store,
  BarChart3,
  Upload,
  Camera,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  PawPrint
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { MedicationReminders } from "@/components/paziente/MedicationReminders";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Terapia {
  id: number;
  farmaco: any;
  stato: string;
  dataInizio: string;
  dataFine?: string;
}

interface DashboardStats {
  totalePrescrizioni: number;
  totaleOrdini: number;
  totaleTerapie: number;
  ordiniInConsegna: number;
  prescrizioniAttive: number;
}

interface RichiestaPrescrizione {
  id: number;
  farmaco: string;
  stato: string;
  dataRichiesta: string;
  motivazione?: string;
}

interface RichiestaRinnovo {
  id: number;
  prescrizioneId: number;
  farmaco: string;
  stato: string;
  dataRichiesta: string;
}

interface Animale {
  id: number;
  nome: string;
  specie: string;
  razza?: string;
  dataNascita?: string;
  sesso: string;
  microchip?: string;
  foto?: string;
}

import { FirstLoginWizardRedirect } from "@/components/paziente/FirstLoginWizardRedirect";

export default function PazienteDashboard() {
  const { toast } = useToast();
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<Paziente>({
    queryKey: ["paziente-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Paziente>>("/paziente/profile");
      return response.data.data;
    },
  });

  const { data: prescrizioni, isLoading: prescrizioniLoading } = useQuery<Prescrizione[]>({
    queryKey: ["paziente-prescrizioni"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prescrizione[]>>("/paziente/prescrizioni");
      return response.data.data;
    },
  });

  const { data: ordini, isLoading: ordiniLoading } = useQuery<Ordine[]>({
    queryKey: ["paziente-ordini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine[]>>("/paziente/ordini");
      return response.data.data;
    },
  });

  const { data: terapie, isLoading: terapieLoading } = useQuery<Terapia[]>({
    queryKey: ["paziente-terapie"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Terapia[]>>("/paziente/terapie");
      return response.data.data;
    },
  });

  // Fetch richieste prescrizione
  const { data: richiestePrescrizione, isLoading: richiesteLoading } = useQuery<RichiestaPrescrizione[]>({
    queryKey: ["paziente-richieste-prescrizione"],
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<RichiestaPrescrizione[]>>("/paziente/richieste-prescrizione");
        return response.data.data || [];
      } catch (error) {
        return [];
      }
    },
  });

  // Fetch richieste rinnovo
  const { data: richiesteRinnovo, isLoading: rinnoviLoading } = useQuery<RichiestaRinnovo[]>({
    queryKey: ["paziente-richieste-rinnovo"],
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<RichiestaRinnovo[]>>("/paziente/richieste-rinnovo");
        return response.data.data || [];
      } catch (error) {
        return [];
      }
    },
  });

  // Fetch animali
  const { data: animali, isLoading: animaliLoading } = useQuery<Animale[]>({
    queryKey: ["paziente-animali"],
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<Animale[]>>("/paziente/animali");
        return response.data.data || [];
      } catch (error) {
        return [];
      }
    },
  });

  const { data: _stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["paziente-dashboard-stats"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardStats>>("/paziente/dashboard-stats");
      return response.data.data;
    },
  });

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      toast({
        title: "Errore",
        description: "Formato non supportato. Usa JPG, PNG, WEBP o HEIC (iPhone)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Errore",
        description: "Il file è troppo grande (max 10MB)",
        variant: "destructive",
      });
      return;
    }

    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/paziente/upload/talloncino/ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: "Foto caricata",
        description: "La foto del talloncino è stata caricata con successo",
      });
    } catch (error) {
      console.error("Errore upload:", error);
      toast({
        title: "Errore",
        description: "Errore durante il caricamento della foto",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  }, [toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  if (profileLoading || prescrizioniLoading || ordiniLoading || terapieLoading || statsLoading || richiesteLoading || rinnoviLoading || animaliLoading) {
    return <Loading />;
  }

  const prescrizioniAttive = prescrizioni?.filter((p) => p.stato === "attiva") || [];
  const prescrizioniScadute = prescrizioni?.filter((p) => p.stato === "scaduta") || [];
  const prescrizioniUtilizzate = prescrizioni?.filter((p) => p.stato === "utilizzata") || [];
  const ordiniInConsegna = ordini?.filter((o) => o.stato === "in_consegna" || o.stato === "pronto") || [];
  const ordiniCompletati = ordini?.filter((o) => o.stato === "consegnato") || [];
  const terapieAttive = terapie?.filter((t) => t.stato === "attiva") || [];

  // Richieste in attesa
  const richiesteInAttesa = richiestePrescrizione?.filter((r) => r.stato === "in_attesa") || [];
  const rinnoviInAttesa = richiesteRinnovo?.filter((r) => r.stato === "in_attesa") || [];
  const hasRichiesteInAttesa = richiesteInAttesa.length > 0 || rinnoviInAttesa.length > 0;

  // Prossimi ordini (più recenti)
  const prossimiOrdini = ordini?.slice(0, 3) || [];
  const prossimePrescrizioni = prescrizioni?.slice(0, 3) || [];

  // Pie chart data
  const prescrizioniStats = {
    attive: prescrizioniAttive.length,
    scadute: prescrizioniScadute.length,
    utilizzate: prescrizioniUtilizzate.length,
  };
  const totalPrescrizioni = prescrizioniStats.attive + prescrizioniStats.scadute + prescrizioniStats.utilizzate;

  return (
    <FirstLoginWizardRedirect>
      <div className="space-y-6 animate-fade-in">
      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border border-primary/20"
      >
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Dashboard Paziente
            </h1>
            <p className="text-gray-600 mt-2">
              Benvenuto, {profile?.nome} {profile?.cognome}
            </p>
            {profile?.codiceFiscale && (
              <Badge variant="outline" className="mt-2">
                <User className="h-3 w-3 mr-1" />
                CF: {profile.codiceFiscale}
              </Badge>
            )}
          </div>
          <Link href="/paziente/profilo">
            <Button variant="outline" className="hover-lift">
              Vedi Profilo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="absolute inset-0 shimmer opacity-30" />
      </motion.div>

      {/* Alert Banner per Richieste in Attesa */}
      {hasRichiesteInAttesa && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-yellow-800">
                Hai {richiesteInAttesa.length + rinnoviInAttesa.length} richieste in attesa di conferma
              </span>
              <div className="flex gap-2">
                {richiesteInAttesa.length > 0 && (
                  <Link href="#richieste-prescrizione">
                    <Button variant="outline" size="sm" className="text-yellow-700 border-yellow-300 hover:bg-yellow-100">
                      Vedi Richieste Farmaci
                    </Button>
                  </Link>
                )}
                {rinnoviInAttesa.length > 0 && (
                  <Link href="#richieste-rinnovo">
                    <Button variant="outline" size="sm" className="text-yellow-700 border-yellow-300 hover:bg-yellow-100">
                      Vedi Richieste Rinnovo
                    </Button>
                  </Link>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* First access: nessuna terapia */}
      {terapieAttive.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Alert className="bg-blue-50 border-blue-200">
            <Pill className="h-4 w-4 text-blue-700" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <span className="text-blue-900">
                Non hai ancora configurato nessuna terapia. Vuoi farlo ora con una guida semplice?
              </span>
              <div className="flex gap-2 shrink-0">
                <Link href="/paziente/terapie/wizard">
                  <Button size="sm" className="bg-blue-700 hover:bg-blue-800">
                    Inizia wizard
                  </Button>
                </Link>
                <Link href="/paziente/terapie/nuova">
                  <Button size="sm" variant="outline" className="border-blue-300 text-blue-800 hover:bg-blue-100">
                    Manuale
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Upload Talloncino Ricetta */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" />
              Carica Talloncino Ricetta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
              } ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="talloncino-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploadingFile}
              />
              <label htmlFor="talloncino-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  {uploadingFile ? (
                    <>
                      <Upload className="h-12 w-12 text-primary animate-pulse" />
                      <p className="text-sm text-gray-600">Caricamento in corso...</p>
                    </>
                  ) : (
                    <>
                      <Camera className="h-12 w-12 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Scatta o carica una foto della ricetta cartacea
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Trascina qui il file oppure clicca per selezionare (max 10MB)
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" disabled={uploadingFile}>
                        <Upload className="h-4 w-4 mr-2" />
                        Carica Foto
                      </Button>
                    </>
                  )}
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Banner Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Link href="/paziente/analytics">
          <Card className="hover-lift cursor-pointer bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Visualizza Analytics Dettagliate</h3>
                    <p className="text-sm text-gray-600">
                      Statistiche complete, wellness score e analisi dell'utilizzo
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      {/* Riepilogo Veloce */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Riepilogo Veloce
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{prescrizioniAttive.length}</div>
                <div className="text-xs text-gray-600 mt-1">Prescrizioni Attive</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-700">{ordiniInConsegna.length}</div>
                <div className="text-xs text-gray-600 mt-1">Ordini in Consegna</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{terapieAttive.length}</div>
                <div className="text-xs text-gray-600 mt-1">Terapie Attive</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-700">{ordiniCompletati.length}</div>
                <div className="text-xs text-gray-600 mt-1">Ordini Completati</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sezioni principali */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Prescrizioni Recenti */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Prescrizioni Recenti
                </CardTitle>
                <Link href="/paziente/prescrizioni">
                  <Button variant="ghost" size="sm">
                    Vedi tutte
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {prossimePrescrizioni.length > 0 ? (
                <div className="space-y-3">
                  {prossimePrescrizioni.map((prescrizione, index) => (
                    <motion.div
                      key={prescrizione.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    >
                      <Link href={`/paziente/prescrizioni/${prescrizione.id}`}>
                        <div className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {prescrizione.numeroRicetta || `Prescrizione #${prescrizione.id}`}
                                </span>
                                <Badge 
                                  variant={prescrizione.stato === "attiva" ? "default" : "outline"}
                                  className="text-xs"
                                >
                                  {prescrizione.stato}
                                </Badge>
                              </div>
                              {prescrizione.dataEmissione && (
                                <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(prescrizione.dataEmissione).toLocaleDateString("it-IT")}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessuna prescrizione disponibile</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Ordini Recenti */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-orange-600" />
                  Ordini Recenti
                </CardTitle>
                <Link href="/paziente/ordini">
                  <Button variant="ghost" size="sm">
                    Vedi tutti
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {prossimiOrdini.length > 0 ? (
                <div className="space-y-3">
                  {prossimiOrdini.map((ordine, index) => (
                    <motion.div
                      key={ordine.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                    >
                      <Link href={`/paziente/ordini/${ordine.id}`}>
                        <div className="p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {ordine.codiceOrdine || `Ordine #${ordine.id}`}
                                </span>
                                <Badge 
                                  variant={
                                    ordine.stato === "consegnato" ? "default" : 
                                    ordine.stato === "in_consegna" ? "secondary" : 
                                    "outline"
                                  }
                                  className="text-xs"
                                >
                                  {ordine.stato}
                                </Badge>
                              </div>
                              {ordine.farmacia && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {ordine.farmacia.nome}
                                </p>
                              )}
                              {ordine.totale && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Totale: €{ordine.totale.toFixed(2)}
                                </p>
                              )}
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nessun ordine disponibile</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reminder Assunzioni Farmaci - Spostato in alto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <MedicationReminders />
      </motion.div>

      {/* Azioni Rapide - Spostato in alto */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.75 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Azioni Rapide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Link href="/paziente/richieste-prescrizione/nuova">
                <Button variant="outline" className="w-full hover-lift">
                  <FileText className="h-4 w-4 mr-2" />
                  Richiedi Prescrizione
                </Button>
              </Link>
              <Link href="/paziente/ordini">
                <Button variant="outline" className="w-full hover-lift">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Nuovo Ordine
                </Button>
              </Link>
              <Link href="/paziente/terapie">
                <Button variant="outline" className="w-full hover-lift">
                  <Pill className="h-4 w-4 mr-2" />
                  Le Mie Terapie
                </Button>
              </Link>
              <Link href="/paziente/cartella-clinica">
                <Button variant="outline" className="w-full hover-lift">
                  <Heart className="h-4 w-4 mr-2" />
                  Cartella Clinica
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* I Miei Animali */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.77 }}
      >
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="h-5 w-5 text-amber-600" />
                I Miei Animali
              </CardTitle>
              <Link href="/paziente/profilo/animali">
                <Button variant="ghost" size="sm">
                  Gestisci
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {animali && animali.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {animali.slice(0, 3).map((animale, index) => (
                  <motion.div
                    key={animale.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                  >
                    <Link href={`/paziente/profilo/animali/${animale.id}/diario`}>
                      <div className="border rounded-lg p-4 hover:shadow-md transition-all hover:border-amber-300">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0">
                            <PawPrint className="h-6 w-6 text-amber-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{animale.nome}</h3>
                            <p className="text-xs text-gray-600 capitalize">{animale.specie}</p>
                            {animale.razza && (
                              <p className="text-xs text-gray-500 truncate">{animale.razza}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <PawPrint className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm mb-3">Nessun animale registrato</p>
                <Link href="/paziente/profilo/animali">
                  <Button size="sm" variant="outline">
                    Aggiungi il tuo primo animale
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Le Mie Richieste Prescrizione */}
      <motion.div
        id="richieste-prescrizione"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Le Mie Richieste Prescrizione
              </CardTitle>
              <Link href="/paziente/richieste-prescrizione">
                <Button variant="ghost" size="sm">
                  Vedi tutto
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {richiestePrescrizione && richiestePrescrizione.length > 0 ? (
              <div className="space-y-3">
                {richiestePrescrizione.slice(0, 3).map((richiesta, index) => (
                  <motion.div
                    key={richiesta.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.85 + index * 0.1 }}
                    className="p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{richiesta.farmaco}</span>
                          <Badge 
                            variant={
                              richiesta.stato === "approvata" ? "default" : 
                              richiesta.stato === "in_attesa" ? "secondary" : 
                              "outline"
                            }
                            className="text-xs"
                          >
                            {richiesta.stato === "in_attesa" ? "In attesa" : 
                             richiesta.stato === "approvata" ? "Approvata" : 
                             richiesta.stato === "rifiutata" ? "Rifiutata" : richiesta.stato}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(richiesta.dataRichiesta).toLocaleDateString("it-IT")}
                        </p>
                        {richiesta.motivazione && (
                          <p className="text-xs text-gray-500 mt-1">{richiesta.motivazione}</p>
                        )}
                      </div>
                      {richiesta.stato === "in_attesa" && (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      {richiesta.stato === "approvata" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {richiesta.stato === "rifiutata" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna richiesta prescrizione</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Le Mie Richieste Rinnovo */}
      <motion.div
        id="richieste-rinnovo"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.85 }}
      >
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-green-600" />
                Le Mie Richieste Rinnovo
              </CardTitle>
              <Link href="/paziente/richieste-rinnovo">
                <Button variant="ghost" size="sm">
                  Vedi tutto
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {richiesteRinnovo && richiesteRinnovo.length > 0 ? (
              <div className="space-y-3">
                {richiesteRinnovo.slice(0, 3).map((rinnovo, index) => (
                  <motion.div
                    key={rinnovo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                    className="p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{rinnovo.farmaco}</span>
                          <Badge 
                            variant={
                              rinnovo.stato === "approvata" ? "default" : 
                              rinnovo.stato === "in_attesa" ? "secondary" : 
                              "outline"
                            }
                            className="text-xs"
                          >
                            {rinnovo.stato === "in_attesa" ? "In attesa" : 
                             rinnovo.stato === "approvata" ? "Approvata" : 
                             rinnovo.stato === "rifiutata" ? "Rifiutata" : rinnovo.stato}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(rinnovo.dataRichiesta).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                      {rinnovo.stato === "in_attesa" && (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      {rinnovo.stato === "approvata" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {rinnovo.stato === "rifiutata" && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nessuna richiesta rinnovo</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Distribuzione Prescrizioni per Stato (Pie Chart) */}
      {totalPrescrizioni > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600" />
                Distribuzione Prescrizioni per Stato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-8">
                {/* Simple Pie Chart Visualization */}
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {/* Attive - Blue */}
                    {prescrizioniStats.attive > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="20"
                        strokeDasharray={`${(prescrizioniStats.attive / totalPrescrizioni) * 251.2} 251.2`}
                        strokeDashoffset="0"
                      />
                    )}
                    {/* Scadute - Red */}
                    {prescrizioniStats.scadute > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="20"
                        strokeDasharray={`${(prescrizioniStats.scadute / totalPrescrizioni) * 251.2} 251.2`}
                        strokeDashoffset={`-${(prescrizioniStats.attive / totalPrescrizioni) * 251.2}`}
                      />
                    )}
                    {/* Utilizzate - Green */}
                    {prescrizioniStats.utilizzate > 0 && (
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="20"
                        strokeDasharray={`${(prescrizioniStats.utilizzate / totalPrescrizioni) * 251.2} 251.2`}
                        strokeDashoffset={`-${((prescrizioniStats.attive + prescrizioniStats.scadute) / totalPrescrizioni) * 251.2}`}
                      />
                    )}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalPrescrizioni}</div>
                      <div className="text-xs text-gray-500">Totale</div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-3">
                  {prescrizioniStats.attive > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span className="text-sm">
                        <span className="font-semibold">{prescrizioniStats.attive}</span> Attive
                      </span>
                    </div>
                  )}
                  {prescrizioniStats.scadute > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <span className="text-sm">
                        <span className="font-semibold">{prescrizioniStats.scadute}</span> Scadute
                      </span>
                    </div>
                  )}
                  {prescrizioniStats.utilizzate > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span className="text-sm">
                        <span className="font-semibold">{prescrizioniStats.utilizzate}</span> Utilizzate
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Shop Farmacia */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.85 }}
      >
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5 text-green-600" />
                Shop Farmacia
              </CardTitle>
              <Link href="/paziente/shop">
                <Button variant="ghost" size="sm">
                  Vedi tutto
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Prodotto Placeholder 1 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.9 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg mb-3 flex items-center justify-center">
                  <Pill className="h-12 w-12 text-blue-400" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Misuratore Pressione</h3>
                <p className="text-xs text-gray-600 mb-2">Digitale, bracciale automatico</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">€29,90</span>
                  <Button size="sm" variant="outline">
                    Aggiungi
                  </Button>
                </div>
              </motion.div>

              {/* Prodotto Placeholder 2 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.95 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gradient-to-br from-green-100 to-green-50 rounded-lg mb-3 flex items-center justify-center">
                  <Heart className="h-12 w-12 text-green-400" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Calze Compressione</h3>
                <p className="text-xs text-gray-600 mb-2">Mediche, classe 2</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">€19,90</span>
                  <Button size="sm" variant="outline">
                    Aggiungi
                  </Button>
                </div>
              </motion.div>

              {/* Prodotto Placeholder 3 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 1.0 }}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg mb-3 flex items-center justify-center">
                  <Activity className="h-12 w-12 text-purple-400" />
                </div>
                <h3 className="font-semibold text-sm mb-1">Integratore Aglio</h3>
                <p className="text-xs text-gray-600 mb-2">Per la circolazione</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary">€12,90</span>
                  <Button size="sm" variant="outline">
                    Aggiungi
                  </Button>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </FirstLoginWizardRedirect>
  );
}
