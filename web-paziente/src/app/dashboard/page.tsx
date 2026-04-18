"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import type { ApiResponse, Paziente, Prescrizione, Ordine, Terapia, DashboardStats } from "@/types/api";
import { FileText, ShoppingCart, Activity, TrendingUp, ArrowRight, ExternalLink, Clock, AlertCircle, Phone, Mail, MapPin, Truck, Plus, LogOut, Pill, AlertTriangle, CheckCircle2, XCircle, Camera, ClipboardCheck, RefreshCw } from "lucide-react";
import { ProssimeAssunzioniCard } from "@/components/paziente/ProssimeAssunzioniCard";
import { MedicationReminders } from "@/components/paziente/MedicationReminders";
import { StatisticheOrdiniChart } from "@/components/paziente/StatisticheOrdiniChart";
import { PrescrizioniPerStatoChart } from "@/components/paziente/PrescrizioniPerStatoChart";
import { ImageUpload } from "@/components/paziente/ImageUpload";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (value?: number | string | null) => {
  if (value === undefined || value === null) {
    return "-";
  }

  const numericValue = typeof value === "number" ? value : Number(value);

  if (Number.isNaN(numericValue)) {
    return "-";
  }

  return `€${numericValue.toFixed(2)}`;
};

const toArray = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;

    if (Array.isArray(payload.data)) {
      return payload.data as T[];
    }

    if (payload.data && typeof payload.data === "object") {
      const nested = payload.data as Record<string, unknown>;
      if (Array.isArray(nested.data)) {
        return nested.data as T[];
      }
    }
  }

  return [];
};

export default function PazienteDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const userRole = useUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUploadRapido, setShowUploadRapido] = useState(false);
  const [filtroPrescrizioni, setFiltroPrescrizioni] = useState<string>("tutte");
  const [filtroOrdini, setFiltroOrdini] = useState<string>("tutti");
  const [isInitializing, setIsInitializing] = useState(true);
  const canFetchProtectedData = userRole === "paziente" && !!user && !isInitializing;

  // Add initialization delay to ensure tokens are properly set
  useEffect(() => {
    if (userRole === "paziente" && user) {
      // Small delay to ensure tokens are properly set in localStorage and axios
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsInitializing(false);
    }
  }, [userRole, user]);

  // Verifica che l'utente sia paziente e reindirizza altri ruoli
  useEffect(() => {
    if (userRole) {
      switch (userRole) {
        case "admin":
          router.push("/admin/dashboard");
          return;
        case "medico":
          router.push("/medico/dashboard");
          return;
        case "specialista":
          router.push("/specialista/dashboard");
          return;
        case "farmacista":
          router.push("/farmacia/dashboard");
          return;
        case "rider":
          router.push("/delivery/dashboard");
          return;
        case "paziente":
          // Rimani sulla dashboard paziente
          break;
        default:
          // Ruolo non riconosciuto, reindirizza al login
          router.push("/login");
          return;
      }
    } else if (user === null) {
      // Utente non autenticato
      router.push("/login");
    }
  }, [userRole, user, router]);

  const { data: profile, isLoading: profileLoading } = useQuery<Paziente>({
    queryKey: ["paziente-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Paziente>>("/paziente/profile");
      return response.data.data;
    },
    enabled: canFetchProtectedData,
  });

  const { data: prescrizioni, isLoading: prescrizioniLoading } = useQuery<Prescrizione[]>({
    queryKey: ["paziente-prescrizioni"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prescrizione[]>>("/paziente/prescrizioni");
      return toArray<Prescrizione>(response.data);
    },
    enabled: canFetchProtectedData,
  });

  const { data: ordini, isLoading: ordiniLoading } = useQuery<Ordine[]>({
    queryKey: ["paziente-ordini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Ordine[]>>("/paziente/ordini");
      return toArray<Ordine>(response.data);
    },
    enabled: canFetchProtectedData,
  });

  // ✅ Task 1.1.1: Caricare terapie attive
  const { data: terapie, isLoading: terapieLoading } = useQuery<Terapia[]>({
    queryKey: ["paziente-terapie"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Terapia[]>>("/paziente/terapie");
      return toArray<Terapia>(response.data);
    },
    enabled: canFetchProtectedData,
  });

  // Caricare terapie con reminder (giorni rimanenti, stato reminder)
  const { data: terapieConReminder, isLoading: terapieReminderLoading } = useQuery<Terapia[]>({
    queryKey: ["paziente-terapie-reminder"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Terapia[]>>("/paziente/terapie/reminder");
      return toArray<Terapia>(response.data);
    },
    enabled: canFetchProtectedData,
  });

  // ✅ Task 1.1.4: Caricare statistiche dashboard
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["paziente-dashboard-stats"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DashboardStats>>("/paziente/dashboard-stats");
      return response.data.data;
    },
    enabled: canFetchProtectedData,
  });

  // ✅ Task 1.4.3: Caricare prossime assunzioni per lista dedicata
  const { data: prossimeAssunzioni, isLoading: assunzioniLoading } = useQuery<any[]>({
    queryKey: ["paziente-assunzioni-prossime"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/paziente/assunzioni-programmate");
      return toArray<any>(response.data);
    },
    enabled: canFetchProtectedData,
  });

  // Carica richieste prescrizione
  const { data: richiestePrescrizione, isLoading: richiestePrescrizioneLoading } = useQuery<any[]>({
    queryKey: ["paziente-richieste-prescrizione"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/paziente/richieste-prescrizione");
      return toArray<any>(response.data);
    },
    enabled: canFetchProtectedData,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Carica richieste rinnovo
  const { data: richiesteRinnovo, isLoading: richiesteRinnovoLoading } = useQuery<any[]>({
    queryKey: ["paziente-richieste-rinnovo"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/paziente/richieste-rinnovo");
      return toArray<any>(response.data);
    },
    enabled: canFetchProtectedData,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Lazy loading: carica dati in modo incrementale
  const isLoadingCritical = profileLoading || prescrizioniLoading || ordiniLoading;

  // Memoizza variabili derivate per evitare ricreazioni ad ogni render
  const terapieAttive = useMemo(() => terapieConReminder || terapie || [], [terapieConReminder, terapie]);
  const terapieCritiche = useMemo(() => 
    terapieAttive.filter((t) => t.statoReminder === 'critical'),
    [terapieAttive]
  );
  const terapieWarning = useMemo(() => 
    terapieAttive.filter((t) => t.statoReminder === 'warning'),
    [terapieAttive]
  );
  const assunzioniOggi = useMemo(() => {
    if (!prossimeAssunzioni) return [];
    const oggi = new Date();
    return prossimeAssunzioni.filter((a) => {
      const data = new Date(a.dataOraProgrammata);
      return (
        data.getDate() === oggi.getDate() &&
        data.getMonth() === oggi.getMonth() &&
        data.getFullYear() === oggi.getFullYear() &&
        !a.giaAssunta
      );
    });
  }, [prossimeAssunzioni]);

  // Flag per evitare toast duplicati
  const toastShownRef = useRef<{ terapieCritiche?: number; assunzioniRitardo?: number }>({});

  // Notifiche toast per eventi importanti - SPOSTATI PRIMA DEL RETURN CONDIZIONALE
  useEffect(() => {
    const count = terapieCritiche.length;
    if (count > 0 && toastShownRef.current.terapieCritiche !== count) {
      toastShownRef.current.terapieCritiche = count;
      toast({
        title: "⚠️ Attenzione: Terapie Urgenti",
        description: `Hai ${count} terapia${count !== 1 ? 'e' : ''} che richiedono attenzione immediata`,
        variant: "destructive",
      });
    }
  }, [terapieCritiche.length, toast]);

  useEffect(() => {
    if (assunzioniOggi.length > 0) {
      const assunzioniInRitardo = assunzioniOggi.filter((a: any) => {
        return new Date(a.dataOraProgrammata) < new Date();
      });
      const count = assunzioniInRitardo.length;
      if (count > 0 && toastShownRef.current.assunzioniRitardo !== count) {
        toastShownRef.current.assunzioniRitardo = count;
        toast({
          title: "⏰ Assunzioni in Ritardo",
          description: `Hai ${count} assunzione${count !== 1 ? 'i' : ''} in ritardo oggi`,
          variant: "destructive",
        });
      }
    }
  }, [assunzioniOggi.length, toast]);

  // ✅ Auto-avvio wizard: se il paziente non ha terapie né storico, redirect al wizard
  useEffect(() => {
    // Aspetta che i dati siano caricati (non in loading e non initializing)
    if (isInitializing || terapieLoading || prescrizioniLoading) return;
    // Solo per utenti paziente autenticati
    if (userRole !== "paziente" || !user) return;

    const hasTerapie = (terapie ?? []).length > 0;
    const hasPrescrizioni = (prescrizioni ?? []).length > 0;

    if (!hasTerapie && !hasPrescrizioni) {
      router.push("/paziente/terapie/wizard");
    }
  }, [isInitializing, terapieLoading, prescrizioniLoading, terapie, prescrizioni, userRole, user, router]);

  // Mutation per registrare assunzione
  const registraAssunzioneMutation = useMutation({
    mutationFn: async (assunzione: any) => {
      const response = await api.post<ApiResponse<any>>("/paziente/assunzioni", {
        terapiaId: assunzione.terapiaId,
        dataOraProgrammata: assunzione.dataOraProgrammata,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-assunzioni-prossime"] });
      queryClient.invalidateQueries({ queryKey: ["paziente-terapie-reminder"] });
      toast({
        title: "Assunzione registrata",
        description: "L'assunzione è stata registrata con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante la registrazione",
        variant: "destructive",
      });
    },
  });

  // Return condizionale DOPO tutti gli hooks
  if (isLoadingCritical) {
    return <Loading />;
  }

  // Filtri prescrizioni
  const prescrizioniFiltrate = prescrizioni?.filter((p) => {
    if (filtroPrescrizioni === "tutte") return true;
    if (filtroPrescrizioni === "attive") return p.stato === "attiva";
    if (filtroPrescrizioni === "scadute") return p.stato === "scaduta";
    if (filtroPrescrizioni === "utilizzate") return p.stato === "utilizzata";
    return true;
  }) || [];

  const prescrizioniAttive = prescrizioni?.filter((p) => p.stato === "attiva") || [];
  
  // Filtri ordini
  const ordiniFiltrati = ordini?.filter((o) => {
    if (filtroOrdini === "tutti") return true;
    if (filtroOrdini === "in_corso") return ["creato", "in_preparazione", "in_consegna"].includes(o.stato);
    if (filtroOrdini === "consegnati") return o.stato === "consegnato";
    if (filtroOrdini === "pronti") return o.stato === "pronto";
    return true;
  }) || [];
  
  const ordiniInCorso = ordini?.filter((o) => ["creato", "in_preparazione", "in_consegna"].includes(o.stato)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Benvenuto, {profile?.nome} {profile?.cognome}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={logout}
          className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>

      {/* Azioni Rapide */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Azioni Rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/prescrizioni">
              <Button variant="outline" className="w-full justify-start h-auto py-3 flex-col items-start">
                <FileText className="h-5 w-5 mb-2 text-blue-600" />
                <span className="text-sm font-medium">Le Mie Prescrizioni</span>
                <span className="text-xs text-gray-500 mt-1">
                  {prescrizioniAttive.length} attive
                </span>
              </Button>
            </Link>
            <Link href="/ordini">
              <Button variant="outline" className="w-full justify-start h-auto py-3 flex-col items-start">
                <ShoppingCart className="h-5 w-5 mb-2 text-green-600" />
                <span className="text-sm font-medium">I Miei Ordini</span>
                <span className="text-xs text-gray-500 mt-1">
                  {ordiniInCorso.length} in corso
                </span>
              </Button>
            </Link>
            <Link href="/paziente/terapie/nuova">
              <Button variant="outline" className="w-full justify-start h-auto py-3 flex-col items-start">
                <Plus className="h-5 w-5 mb-2 text-purple-600" />
                <span className="text-sm font-medium">Nuova Terapia</span>
                <span className="text-xs text-gray-500 mt-1">Aggiungi farmaco</span>
              </Button>
            </Link>
            <Link href="/prescrizioni/nuova">
              <Button variant="outline" className="w-full justify-start h-auto py-3 flex-col items-start">
                <FileText className="h-5 w-5 mb-2 text-blue-600" />
                <span className="text-sm font-medium">Richiedi Prescrizione</span>
                <span className="text-xs text-gray-500 mt-1">Contatta medico</span>
              </Button>
            </Link>
            <Link href="/farmacie">
              <Button variant="outline" className="w-full justify-start h-auto py-3 flex-col items-start">
                <MapPin className="h-5 w-5 mb-2 text-orange-600" />
                <span className="text-sm font-medium">Cerca Farmacie</span>
                <span className="text-xs text-gray-500 mt-1">Vicine a te</span>
              </Button>
            </Link>
            <Link href="/paziente/cartella-clinica">
              <Button variant="outline" className="w-full justify-start h-auto py-3 flex-col items-start">
                <ClipboardCheck className="h-5 w-5 mb-2 text-indigo-600" />
                <span className="text-sm font-medium">Cartella Clinica</span>
                <span className="text-xs text-gray-500 mt-1">Diario e documenti</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/prescrizioni">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prescrizioni Attive</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.prescrizioni.attive || prescrizioniAttive.length}</div>
              <p className="text-xs text-muted-foreground">
                di {stats?.prescrizioni.totali || prescrizioni?.length || 0} totali
              </p>
              {prescrizioniAttive.length > 0 && (
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  Vedi tutte <ArrowRight className="h-3 w-3" />
                </p>
              )}
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/ordini">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ordini in Corso</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.ordini.inCorso || ordiniInCorso.length}</div>
              <p className="text-xs text-muted-foreground">
                di {stats?.ordini.totali || ordini?.length || 0} totali
              </p>
              {ordiniInCorso.length > 0 && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  Traccia ordini <ArrowRight className="h-3 w-3" />
                </p>
              )}
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <Link href="/paziente/terapie">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terapie Attive</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.terapie.attive || terapieAttive.length}</div>
              <p className="text-xs text-muted-foreground">
                {terapieAttive.length > 0 
                  ? `${terapieAttive.length} terapia/i in corso`
                  : "Nessuna terapia attiva"}
              </p>
              {terapieAttive.length > 0 && (
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  Vedi dettagli <ArrowRight className="h-3 w-3" />
                </p>
              )}
              {terapieAttive.length === 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Aggiungi una terapia
                </p>
              )}
            </CardContent>
          </Link>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spesa Ultimo Mese</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.spesa.ultimoMese ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ordini consegnati
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sezione Upload Foto Rapido */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Upload Foto Talloncino Rapido</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUploadRapido(!showUploadRapido)}
            >
              {showUploadRapido ? "Nascondi" : "Mostra"}
            </Button>
          </div>
        </CardHeader>
        {showUploadRapido && (
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Carica una foto del talloncino della scatola per trovare automaticamente il farmaco e creare una nuova terapia.
              </p>
              <ImageUpload
                enableOcr={true}
                onChange={(url) => {
                  if (url) {
                    toast({
                      title: "Foto caricata!",
                      description: "Ora puoi creare una nuova terapia con questo farmaco.",
                    });
                    // Reindirizza alla pagina nuova terapia con il farmaco pre-selezionato
                    setTimeout(() => {
                      router.push("/paziente/terapie/nuova");
                    }, 1500);
                  }
                }}
                onFarmaciFound={(farmaci) => {
                  if (farmaci && farmaci.length > 0) {
                    toast({
                      title: "Farmaco trovato!",
                      description: `Trovato: ${farmaci[0].nomeCommerciale}. ${farmaci.length > 1 ? `Altri ${farmaci.length - 1} risultati disponibili.` : ""}`,
                    });
                  } else {
                    toast({
                      title: "Nessun farmaco trovato",
                      description: "Cerca manualmente il farmaco nella pagina nuova terapia.",
                      variant: "default",
                    });
                  }
                }}
                label=""
                maxSize={5}
                className="w-full"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Sezione Terapie Attive con Reminder - Migliorata */}
      {terapieAttive.length > 0 && (
        <Card className={terapieCritiche.length > 0 ? "border-red-300 bg-red-50 shadow-lg" : terapieWarning.length > 0 ? "border-orange-300 bg-orange-50 shadow-md" : "border-blue-200 bg-blue-50"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className={`h-5 w-5 ${
                  terapieCritiche.length > 0 ? "text-red-600" : 
                  terapieWarning.length > 0 ? "text-orange-600" : 
                  "text-blue-600"
                }`} />
                <CardTitle className={`text-lg ${
                  terapieCritiche.length > 0 ? "text-red-700" : 
                  terapieWarning.length > 0 ? "text-orange-700" : 
                  "text-blue-700"
                }`}>
                  Le Mie Terapie
                  {terapieCritiche.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-red-600">
                      ⚠️ {terapieCritiche.length} urgente{terapieCritiche.length !== 1 ? 'i' : ''}
                    </span>
                  )}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {terapieCritiche.length > 0 && (
                  <span className="text-xs font-bold text-red-600 bg-red-200 px-3 py-1 rounded-full animate-pulse">
                    ATTENZIONE
                  </span>
                )}
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                terapieCritiche.length > 0 ? "text-red-600 bg-red-100" : 
                terapieWarning.length > 0 ? "text-orange-600 bg-orange-100" : 
                "text-blue-600 bg-blue-100"
              }`}>
                {terapieAttive.length} attiva{terapieAttive.length !== 1 ? 'e' : ''}
              </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {terapieAttive.map((terapia) => {
                const getReminderColor = (stato?: string) => {
                  switch (stato) {
                    case 'critical':
                      return 'bg-red-50 border-red-300';
                    case 'warning':
                      return 'bg-orange-50 border-orange-300';
                    default:
                      return 'bg-green-50 border-green-300';
                  }
                };

                const getReminderIcon = (stato?: string) => {
                  switch (stato) {
                    case 'critical':
                      return <AlertTriangle className="h-5 w-5 text-red-600" />;
                    case 'warning':
                      return <AlertCircle className="h-5 w-5 text-orange-600" />;
                    default:
                      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
                  }
                };

                const getReminderBadge = (stato?: string) => {
                  switch (stato) {
                    case 'critical':
                      return <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">URGENTE</span>;
                    case 'warning':
                      return <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded">ATTENZIONE</span>;
                    default:
                      return <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">OK</span>;
                  }
                };

                return (
                  <div
                    key={terapia.id}
                    className={`p-4 rounded-lg border ${getReminderColor(terapia.statoReminder)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getReminderIcon(terapia.statoReminder)}
                        <p className="font-medium text-sm">
                          {terapia.farmaco?.nomeCommerciale || "Farmaco"}
                        </p>
                      </div>
                      {getReminderBadge(terapia.statoReminder)}
                    </div>
                    
                    {terapia.farmaco?.ricettaRichiesta !== undefined && (
                      <div className="mb-2">
                        {terapia.farmaco.ricettaRichiesta ? (
                          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded inline-flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Richiede Ricetta
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded inline-flex items-center gap-1">
                            <Pill className="h-3 w-3" />
                            Da Banco (OTC)
                          </span>
                        )}
                      </div>
                    )}

                    {terapia.posologia && (
                      <p className="text-xs text-gray-600 mb-2">
                        <span className="font-medium">Posologia:</span> {terapia.posologia}
                      </p>
                    )}

                    {terapia.giorniRimanenti !== undefined && (
                      <div className="mb-2">
                        <p className={`text-sm font-bold ${
                          terapia.statoReminder === 'critical' ? 'text-red-600' :
                          terapia.statoReminder === 'warning' ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {terapia.giorniRimanenti > 0 
                            ? `${terapia.giorniRimanenti} giorni rimanenti`
                            : 'Scaduta'
                          }
                        </p>
                        {terapia.quantitaRimanente !== undefined && terapia.compressePerScatola && (
                          <p className="text-xs text-gray-500 mt-1">
                            {terapia.quantitaRimanente} compresse rimanenti
                            {terapia.numeroScatole && (
                              <> • {terapia.numeroScatole} scatola{terapia.numeroScatole !== 1 ? 'e' : ''}</>
                            )}
                          </p>
                        )}
                      </div>
                    )}

                    {terapia.messaggioReminder && (
                      <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                        <p className="text-xs text-gray-700">
                          {terapia.messaggioReminder}
                        </p>
                      </div>
                    )}

                    {terapia.prescrizione && (
                      <div className="mt-2 text-xs text-gray-600">
                        {terapia.prescrizione.ripetibile && (
                          <p>
                            Ricetta Ripetibile (RR): {terapia.prescrizione.ripetizioniUtilizzate || 0}/{terapia.prescrizione.numeroRipetizioni || 0} utilizzate
                          </p>
                        )}
                        {terapia.prescrizione.tipoRicetta && (
                          <p className="mt-1">
                            Tipo: {terapia.prescrizione.tipoRicetta}
                          </p>
                        )}
                        {terapia.prescrizione.dataValidita && (
                          <p className="mt-1">
                            Valida fino: {new Date(terapia.prescrizione.dataValidita).toLocaleDateString("it-IT")}
                          </p>
                        )}
                      </div>
                    )}

                    {terapia.medico && (
                      <p className="text-xs text-gray-500 mt-2">
                        Dr. {terapia.medico.nome} {terapia.medico.cognome}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sezione Medication Reminders - Reminder Assunzioni */}
      <MedicationReminders />

      {/* ✅ Task 1.4.3: Sezione Assunzioni Oggi (se presenti) */}
      {assunzioniOggi.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg">Assunzioni di Oggi</CardTitle>
              </div>
              <span className="text-sm font-medium text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                {assunzioniOggi.length} da assumere
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {assunzioniOggi.slice(0, 6).map((assunzione: any, index: number) => {
                const formatOrario = (dataOra: string) => {
                  const data = new Date(dataOra);
                  return data.toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                };

                const isPassata = (dataOra: string) => {
                  return new Date(dataOra) < new Date();
                };

                const isOggi = (dataOra: string) => {
                  const data = new Date(dataOra);
                  const oggi = new Date();
                  return (
                    data.getDate() === oggi.getDate() &&
                    data.getMonth() === oggi.getMonth() &&
                    data.getFullYear() === oggi.getFullYear()
                  );
                };

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      isPassata(assunzione.dataOraProgrammata)
                        ? "bg-red-50 border-red-200"
                        : "bg-white border-orange-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <Clock className={`h-4 w-4 mt-0.5 ${
                          isPassata(assunzione.dataOraProgrammata)
                            ? "text-red-600"
                            : "text-orange-600"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {assunzione.terapia?.farmaco?.nomeCommerciale || "Farmaco"}
                            </p>
                            {assunzione.giaAssunta && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                            {assunzione.terapia?.farmaco?.ricettaRichiesta !== undefined && (
                              assunzione.terapia.farmaco.ricettaRichiesta ? (
                                <span className="text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                                  Ricetta
                                </span>
                              ) : (
                                <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                                  OTC
                                </span>
                              )
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">{formatOrario(assunzione.dataOraProgrammata)}</span>
                            {assunzione.terapia?.conPasto && (
                              <> • <span className="text-blue-600">Con pasto</span></>
                            )}
                          </p>
                          {assunzione.terapia?.posologia && (
                            <p className="text-xs text-gray-500 mt-1">
                              {assunzione.terapia.posologia}
                            </p>
                          )}
                          {isPassata(assunzione.dataOraProgrammata) && (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              In ritardo
                            </p>
                          )}
                        </div>
                      </div>
                      {!assunzione.giaAssunta && isOggi(assunzione.dataOraProgrammata) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2 shrink-0"
                          onClick={() => {
                            registraAssunzioneMutation.mutate(assunzione);
                          }}
                          disabled={registraAssunzioneMutation.isPending}
                        >
                          {registraAssunzioneMutation.isPending ? "Registrando..." : "Segna"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {assunzioniOggi.length > 6 && (
              <p className="text-xs text-gray-600 text-center mt-3">
                E altre {assunzioniOggi.length - 6} assunzioni...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* ✅ Task 1.2.4: Card Prossime Assunzioni */}
        <ProssimeAssunzioniCard />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ultime Prescrizioni</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={filtroPrescrizioni}
                onChange={(e) => setFiltroPrescrizioni(e.target.value)}
                className="text-xs border rounded px-2 py-1 bg-white"
              >
                <option value="tutte">Tutte</option>
                <option value="attive">Attive</option>
                <option value="scadute">Scadute</option>
                <option value="utilizzate">Utilizzate</option>
              </select>
            <Link href="/prescrizioni">
              <Button variant="ghost" size="sm" className="text-xs">
                Vedi tutte
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
            </div>
          </CardHeader>
          <CardContent>
            {prescrizioniFiltrate && prescrizioniFiltrate.length > 0 ? (
              <div className="space-y-3">
                {prescrizioniFiltrate.slice(0, 5).map((prescrizione) => {
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

                  return (
                    <div
                      key={prescrizione.id}
                      className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <Link href={`/prescrizioni/${prescrizione.id}`} className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {new Date(prescrizione.dataEmissione).toLocaleDateString("it-IT", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(prescrizione.stato)}`}>
                              {prescrizione.stato}
                            </span>
                          </div>
                          {prescrizione.medico && (
                            <div className="mb-2">
                              <p className="text-xs text-gray-600 mb-1">
                                Dr. {prescrizione.medico.nome} {prescrizione.medico.cognome}
                                {prescrizione.medico.specializzazione && (
                                  <> • {prescrizione.medico.specializzazione}</>
                                )}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {prescrizione.medico.telefono && (
                                  <a
                                    href={`tel:${prescrizione.medico.telefono}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    <Phone className="h-3 w-3" />
                                    Chiama
                                  </a>
                                )}
                                {prescrizione.medico.emailProfessionale && (
                                  <a
                                    href={`mailto:${prescrizione.medico.emailProfessionale}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    <Mail className="h-3 w-3" />
                                    Email
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          {prescrizione.codiceNre && (
                            <p className="text-xs text-gray-500">
                              NRE: {prescrizione.codiceNre}
                            </p>
                          )}
                          {prescrizione.dataScadenza && (
                            <p className="text-xs text-gray-500 mt-1">
                              Valida fino: {new Date(prescrizione.dataScadenza).toLocaleDateString("it-IT")}
                            </p>
                          )}
                          {prescrizione.farmaci && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">
                                {Array.isArray(prescrizione.farmaci) 
                                  ? `${prescrizione.farmaci.length} farmaco/i`
                                  : "Prescrizione"}
                              </p>
                              {Array.isArray(prescrizione.farmaci) && prescrizione.farmaci.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {prescrizione.farmaci.slice(0, 3).map((farmaco: any, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700"
                                    >
                                      {farmaco.nomeFarmaco || farmaco.nome || "Farmaco"}
                                    </span>
                                  ))}
                                  {prescrizione.farmaci.length > 3 && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                      +{prescrizione.farmaci.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </Link>
                        <div className="flex flex-col items-end gap-2 ml-2">
                          <Link href={`/prescrizioni/${prescrizione.id}`}>
                            <ExternalLink className="h-4 w-4 text-gray-400 hover:text-gray-600 flex-shrink-0" />
                          </Link>
                          {prescrizione.stato === "attiva" && (
                            <Link href={`/prescrizioni/${prescrizione.id}/nuovo-ordine`}>
                              <Button size="sm" variant="outline" className="text-xs">
                                <ShoppingCart className="h-3 w-3 mr-1" />
                                Ordine
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">
                Nessuna prescrizione
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Banner Alert per Richieste in Attesa */}
      {(richiestePrescrizione?.some((r: any) => r.stato === "in_attesa") || richiesteRinnovo?.some((r: any) => r.stato === "in_attesa")) && (
        <Card className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-6 w-6 text-yellow-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 mb-1">
                  Hai richieste in attesa di risposta
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  {richiestePrescrizione?.filter((r: any) => r.stato === "in_attesa").length || 0} richiesta/e prescrizione e{" "}
                  {richiesteRinnovo?.filter((r: any) => r.stato === "in_attesa").length || 0} richiesta/e rinnovo in attesa di approvazione dal medico.
                  Riceverai una notifica quando verranno approvate.
                </p>
                <div className="flex gap-2">
                  <Link href="/paziente/richieste-prescrizione?stato=in_attesa">
                    <Button variant="outline" size="sm" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                      Vedi Richieste Prescrizione
                    </Button>
                  </Link>
                  <Link href="/paziente/richieste-rinnovo?stato=in_attesa">
                    <Button variant="outline" size="sm" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                      Vedi Richieste Rinnovo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sezione Richieste Prescrizione e Rinnovo - Migliorata */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Richieste Prescrizione */}
        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between bg-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <FileText className="h-5 w-5 text-blue-600" />
              Le Mie Richieste Prescrizione
            </CardTitle>
            <Link href="/paziente/richieste-prescrizione">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100">
                Vedi tutte
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {richiestePrescrizioneLoading ? (
              <div className="text-center py-4">
                <Loading />
              </div>
            ) : richiestePrescrizione && richiestePrescrizione.length > 0 ? (
              <div className="space-y-3">
                {richiestePrescrizione.slice(0, 3).map((richiesta: any) => {
                  const getStatusBadge = (stato: string) => {
                    switch (stato) {
                      case "in_attesa":
                        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          In Attesa
                        </Badge>;
                      case "approvata":
                        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Approvata
                        </Badge>;
                      case "rifiutata":
                        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Rifiutata
                        </Badge>;
                      default:
                        return <Badge variant="outline">{stato}</Badge>;
                    }
                  };

                  return (
                    <div key={richiesta.id} className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <Link href={`/paziente/richieste-prescrizione/${richiesta.id}`} className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(richiesta.stato)}
                            <span className="text-xs text-gray-500">
                              {new Date(richiesta.dataRichiesta || richiesta.createdAt).toLocaleDateString("it-IT")}
                            </span>
                          </div>
                          {richiesta.farmaciRichiesti && Array.isArray(richiesta.farmaciRichiesti) && richiesta.farmaciRichiesti.length > 0 && (
                            <p className="text-sm font-medium mt-1">
                              {richiesta.farmaciRichiesti[0].nomeFarmaco}
                              {richiesta.farmaciRichiesti.length > 1 && ` +${richiesta.farmaciRichiesti.length - 1} altri`}
                            </p>
                          )}
                          {richiesta.motivo && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">{richiesta.motivo}</p>
                          )}
                          {richiesta.stato === "in_attesa" && (
                            <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              In attesa di risposta dal medico
                            </p>
                          )}
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {richiestePrescrizione.length > 3 && (
                  <p className="text-xs text-gray-600 text-center mt-2">
                    E altre {richiestePrescrizione.length - 3} richieste...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm font-medium">Nessuna richiesta prescrizione inviata</p>
                <p className="text-xs text-gray-400 mt-1">Le richieste che invii appariranno qui</p>
                <Link href="/prescrizioni/nuova">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="h-3 w-3 mr-1" />
                    Invia Prima Richiesta
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Richieste Rinnovo */}
        <Card className="border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between bg-purple-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              Le Mie Richieste Rinnovo
            </CardTitle>
            <Link href="/paziente/richieste-rinnovo">
              <Button variant="ghost" size="sm" className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-100">
                Vedi tutte
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {richiesteRinnovoLoading ? (
              <div className="text-center py-4">
                <Loading />
              </div>
            ) : richiesteRinnovo && richiesteRinnovo.length > 0 ? (
              <div className="space-y-3">
                {richiesteRinnovo.slice(0, 3).map((richiesta: any) => {
                  const getStatusBadge = (stato: string) => {
                    switch (stato) {
                      case "in_attesa":
                        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          In Attesa
                        </Badge>;
                      case "approvata":
                        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Approvata
                        </Badge>;
                      case "rifiutata":
                        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Rifiutata
                        </Badge>;
                      default:
                        return <Badge variant="outline">{stato}</Badge>;
                    }
                  };

                  return (
                    <div key={richiesta.id} className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <Link href={`/paziente/richieste-rinnovo/${richiesta.id}`} className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(richiesta.stato)}
                            <span className="text-xs text-gray-500">
                              {new Date(richiesta.dataRichiesta || richiesta.createdAt).toLocaleDateString("it-IT")}
                            </span>
                          </div>
                          {richiesta.terapia && (
                            <p className="text-sm font-medium mt-1">
                              {richiesta.terapia.farmaco?.nomeCommerciale || "Terapia"}
                            </p>
                          )}
                          {richiesta.motivo && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">{richiesta.motivo}</p>
                          )}
                        </Link>
                      </div>
                    </div>
                  );
                })}
                {richiesteRinnovo.length > 3 && (
                  <p className="text-xs text-gray-600 text-center mt-2">
                    E altre {richiesteRinnovo.length - 3} richieste...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <RefreshCw className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Nessuna richiesta rinnovo inviata</p>
                <p className="text-xs text-gray-400 mt-1">Le richieste inviate appariranno qui</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ultimi Ordini</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={filtroOrdini}
                onChange={(e) => setFiltroOrdini(e.target.value)}
                className="text-xs border rounded px-2 py-1 bg-white"
              >
                <option value="tutti">Tutti</option>
                <option value="in_corso">In Corso</option>
                <option value="pronti">Pronti</option>
                <option value="consegnati">Consegnati</option>
              </select>
            <Link href="/ordini">
              <Button variant="ghost" size="sm" className="text-xs">
                Vedi tutti
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
            </div>
          </CardHeader>
          <CardContent>
            {ordiniFiltrati && ordiniFiltrati.length > 0 ? (
              <div className="space-y-3">
                {ordiniFiltrati.slice(0, 5).map((ordine) => {
                  const getStatusColor = (stato: string) => {
                    switch (stato.toLowerCase()) {
                      case "consegnato":
                        return "bg-green-100 text-green-800";
                      case "in_consegna":
                      case "in consegna":
                        return "bg-blue-100 text-blue-800";
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
                      consegnato: "Consegnato",
                      in_consegna: "In consegna",
                      "in consegna": "In consegna",
                      pronto: "Pronto",
                      in_preparazione: "In preparazione",
                      "in preparazione": "In preparazione",
                      creato: "Creato",
                    };
                    return labels[stato.toLowerCase()] || stato;
                  };

                  const isInConsegna = ["in_consegna", "in consegna", "assegnato_rider"].includes(ordine.stato.toLowerCase());

                  return (
                    <div
                      key={ordine.id}
                      className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <Link href={`/ordini/${ordine.id}`} className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {ordine.codiceOrdine || `Ordine #${ordine.id}`}
                            </p>
                            <span className={`rounded-full px-2 py-0.5 text-xs ${getStatusColor(ordine.stato)}`}>
                              {getStatusLabel(ordine.stato)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">
                            {new Date(ordine.dataCreazione).toLocaleDateString("it-IT", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          {ordine.farmacia && (
                            <div className="mb-1">
                              <p className="text-xs text-gray-500 mb-1">
                                <MapPin className="h-3 w-3 inline mr-1" />
                                {ordine.farmacia.nome}
                                {ordine.farmacia.citta && ` • ${ordine.farmacia.citta}`}
                              </p>
                              {ordine.farmacia.telefono && (
                                <a
                                  href={`tel:${ordine.farmacia.telefono}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <Phone className="h-3 w-3" />
                                  Chiama farmacia
                                </a>
                              )}
                            </div>
                          )}
                          {ordine.dataConsegnaPrevista && (
                            <p className="text-xs text-blue-600 font-medium mb-1">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Consegna prevista: {new Date(ordine.dataConsegnaPrevista).toLocaleDateString("it-IT")}
                            </p>
                          )}
                          {ordine.rider && (
                            <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                              <p className="text-xs font-medium text-blue-900 mb-1 flex items-center gap-1">
                                <Truck className="h-3 w-3" />
                                In consegna con:
                              </p>
                              <p className="text-xs text-blue-700">
                                {ordine.rider.nome} {ordine.rider.cognome}
                              </p>
                              {ordine.rider.telefono && (
                                <a
                                  href={`tel:${ordine.rider.telefono}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                                >
                                  <Phone className="h-3 w-3" />
                                  Chiama rider
                                </a>
                              )}
                            </div>
                          )}
                          {isInConsegna && !ordine.rider && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <Truck className="h-3 w-3" />
                              In attesa di assegnazione rider
                            </p>
                          )}
                        </Link>
                        <div className="flex flex-col items-end gap-2 ml-2">
                          <Link href={`/ordini/${ordine.id}`}>
                            <ExternalLink className="h-4 w-4 text-gray-400 hover:text-gray-600 flex-shrink-0" />
                          </Link>
                          {(() => {
                            const totaleFormatted = formatCurrency(ordine.totale);
                            if (totaleFormatted === "-") {
                              return null;
                            }
                            return (
                              <p className="text-sm font-semibold text-right">
                                {totaleFormatted}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center py-4">
                Nessun ordine
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grafici */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatisticheOrdiniChart stats={stats} />
        <PrescrizioniPerStatoChart prescrizioni={prescrizioni || []} />
      </div>
    </div>
  );
}
