"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  ClipboardList,
  Clock,
  FileText,
  RefreshCw,
  User,
  LayoutDashboard,
  BarChart3,
  X,
  ChevronUp,
} from "lucide-react";
import api from "@/lib/api";
import type { ApiResponse, Medico } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";

export default function MedicoDashboardMini() {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<Medico>({
    queryKey: ["medico-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Medico>>("/medico/profile");
      return response.data.data;
    },
    retry: false,
  });

  const { data: prescrizioni, isLoading: prescrizioniLoading } = useQuery({
    queryKey: ["medico-prescrizioni-mini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/medico/prescrizioni");
      return response.data.data;
    },
    retry: false,
  });

  const { data: pazienti, isLoading: pazientiLoading } = useQuery({
    queryKey: ["medico-pazienti-mini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/medico/pazienti");
      return response.data.data;
    },
    retry: false,
  });

  const { data: richiestePrescrizione } = useQuery({
    queryKey: ["medico-richieste-prescrizione-mini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/medico/richieste-prescrizione");
      return response.data.data;
    },
    retry: false,
  });

  const { data: richiesteRinnovo } = useQuery({
    queryKey: ["medico-richieste-rinnovo-mini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/medico/richieste-rinnovo");
      return response.data.data;
    },
    retry: false,
  });

  const { data: orariVisita, isLoading: orariLoading } = useQuery({
    queryKey: ["medico-orari-visita-mini"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/medico/gestione/orari");
      return response.data.data ?? response.data;
    },
    retry: false,
  });

  if (profileError && (profileError as any)?.response?.status === 401) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sessione scaduta</h2>
          <p className="text-gray-600 mb-4">Effettua nuovamente il login</p>
          <Button onClick={() => window.location.href = "/login"}>
            Vai al Login
          </Button>
        </div>
      </div>
    );
  }

  if (profileLoading || prescrizioniLoading || pazientiLoading) {
    return <Loading />;
  }

  const richiestePrescrizioneInAttesa =
    richiestePrescrizione?.filter((r) => r.stato === "in_attesa").length || 0;
  const richiesteRinnovoInAttesa =
    richiesteRinnovo?.filter((r: any) => r.stato === "in_attesa").length || 0;
  const prescrizioniRicevute =
    prescrizioni?.filter((p: any) => p.stato === "ricevuta").length || 0;
  const totalPazienti = pazienti?.length || 0;
  const notificheTotali =
    richiestePrescrizioneInAttesa + richiesteRinnovoInAttesa + prescrizioniRicevute;

  const giorniOrari: Record<string, string> = {
    lunedi: "Lunedì",
    martedi: "Martedì",
    mercoledi: "Mercoledì",
    giovedi: "Giovedì",
    venerdi: "Venerdì",
    sabato: "Sabato",
    domenica: "Domenica",
  };

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      {isExpanded && (
        <div className="fixed inset-0 z-20 bg-black/40 md:backdrop-blur-sm" />
      )}

      <div
        className={[
          "relative space-y-4",
          isExpanded ? "z-30 mx-auto max-w-5xl pt-6 px-4 pb-24" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 md:flex-row md:items-center md:justify-between pointer-events-auto">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold md:text-2xl">Mini Dashboard</h1>
            <Badge variant="outline">Studio</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Benvenuto, Dr. {profile?.nome} {profile?.cognome}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:flex">
          <Link href="/medico/prescrizioni/nuova">
            <Button size="sm">Nuova Prescrizione</Button>
          </Link>
          <Link href="/medico/dashboard/full">
            <Button variant="outline" size="sm" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard Completa
            </Button>
          </Link>
          <Link href="/medico/analytics">
            <Button variant="ghost" size="sm" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setIsExpanded(false)}
          >
            <X className="h-4 w-4" />
            Chiudi
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5 pointer-events-auto">
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              Pazienti attivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalPazienti}</div>
            <p className="text-xs text-gray-500">Accesso rapido alle schede</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-orange-600" />
              Nuove richieste farmaci
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{richiestePrescrizioneInAttesa}</div>
            <Link href="/medico/richieste-prescrizione" className="text-xs text-primary">
              Valuta richieste
            </Link>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-amber-600" />
              Rinnovi terapie croniche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{richiesteRinnovoInAttesa}</div>
            <Link href="/medico/richieste-rinnovo" className="text-xs text-primary">
              Gestisci rinnovi
            </Link>
          </CardContent>
        </Card>

        <Card className="border-indigo-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Prescrizioni emesse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{prescrizioniRicevute}</div>
            <Link href="/medico/prescrizioni" className="text-xs text-primary">
              Consulta elenco
            </Link>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Orari di visita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orariLoading ? (
              <p className="text-xs text-gray-500">Caricamento orari…</p>
            ) : orariVisita && orariVisita.length > 0 ? (
              <div className="space-y-1">
                {orariVisita.slice(0, 3).map((orario: any) => (
                  <div key={`${orario.giorno}-${orario.oraInizio}-${orario.oraFine}`} className="flex items-center justify-between text-xs rounded-md bg-emerald-50 px-2 py-1">
                    <span className="font-medium text-emerald-900">
                      {giorniOrari[orario.giorno] || orario.giorno}
                    </span>
                    <span className="text-emerald-700">
                      {orario.oraInizio} - {orario.oraFine}
                    </span>
                  </div>
                ))}
                <Link href="/medico/gestione/orari" className="text-xs text-primary block pt-1">
                  Vedi tutti gli orari
                </Link>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Nessun orario pubblicato.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3 pointer-events-auto">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Notifiche rapide
            </CardTitle>
            <Badge variant="secondary">Mini sempre attiva</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Nuove richieste farmaci</p>
                <p className="text-xs text-gray-500">Valutazioni cliniche per nuovi farmaci</p>
              </div>
              <Badge variant={richiestePrescrizioneInAttesa > 0 ? "destructive" : "outline"}>
                {richiestePrescrizioneInAttesa}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Rinnovi terapie croniche</p>
                <p className="text-xs text-gray-500">Continuità terapeutica per pazienti cronici</p>
              </div>
              <Badge variant={richiesteRinnovoInAttesa > 0 ? "destructive" : "outline"}>
                {richiesteRinnovoInAttesa}
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Prescrizioni emesse</p>
                <p className="text-xs text-gray-500">Monitoraggio aderenza terapeutica</p>
              </div>
              <Badge variant={prescrizioniRicevute > 0 ? "secondary" : "outline"}>
                {prescrizioniRicevute}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Azioni rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/medico/consulti" className="block">
              <Button variant="outline" className="w-full justify-start">
                Richieste consulto
              </Button>
            </Link>
            <Link href="/medico/pazienti" className="block">
              <Button variant="outline" className="w-full justify-start">
                Apri pazienti
              </Button>
            </Link>
            <Link href="/medico/prescrizione-diretta" className="block">
              <Button variant="outline" className="w-full justify-start bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                🎯 Sistema Territoriale
              </Button>
            </Link>
            <Link href="/medico/dashboard/full" className="block">
              <Button className="w-full justify-start">
                Modalita completa
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 md:inset-auto md:bottom-6 md:right-6 md:w-[320px]">
        <div className="mx-auto w-full max-w-3xl px-3 md:max-w-none md:px-0">
          <div className="flex items-center justify-between gap-2 rounded-full border bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bell className="h-4 w-4" />
              </span>
              <span>Comandi Medico</span>
              <ChevronUp className={`h-4 w-4 transition ${isExpanded ? "rotate-180" : ""}`} />
            </button>

            <div className="flex items-center gap-2">
              <Link href="/medico/consulti">
                <Button size="sm" className="rounded-full">
                  Notifiche
                  {notificheTotali > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-primary">
                      {notificheTotali}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/medico/prescrizioni/nuova">
                <Button size="sm" variant="secondary" className="rounded-full">
                  Nuova
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
