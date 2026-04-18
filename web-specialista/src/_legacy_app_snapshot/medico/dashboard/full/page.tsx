"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { StatCard } from "@/components/ui/stat-card";
import type { ApiResponse, Medico } from "@/types/api";
import {
  FileText,
  User,
  Activity,
  ArrowRight,
  Calendar,
  ClipboardList,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon,
  Eye,
  Pill,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MedicoDashboardFull() {
  const [filtroPazienti, setFiltroPazienti] = useState<string>("tutti");
  const [filtroPrescrizioniMedico, setFiltroPrescrizioniMedico] = useState<string>("tutte");

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery<Medico>({
    queryKey: ["medico-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Medico>>("/medico/profile");
      return response.data.data;
    },
    retry: false,
  });

  const { data: prescrizioni, isLoading: prescrizioniLoading } = useQuery({
    queryKey: ["medico-prescrizioni"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/medico/prescrizioni");
      return response.data.data;
    },
    retry: false,
  });

  const { data: pazienti, isLoading: pazientiLoading } = useQuery({
    queryKey: ["medico-pazienti"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/medico/pazienti");
      return response.data.data;
    },
    retry: false,
  });

  const { data: richiestePrescrizione } = useQuery({
    queryKey: ["medico-richieste-prescrizione"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/medico/richieste-prescrizione");
      return response.data.data;
    },
    retry: false,
  });

  const { data: richiesteRinnovo } = useQuery({
    queryKey: ["medico-richieste-rinnovo"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/medico/richieste-rinnovo");
      return response.data.data;
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

  const richiesteInAttesa = richiestePrescrizione?.filter((r) => r.stato === "in_attesa").length || 0;
  const richiesteRinnovoInAttesa = richiesteRinnovo?.filter((r: any) => r.stato === "in_attesa").length || 0;
  const prescrizioniAttive = prescrizioni?.filter((p: any) => p.stato === "attiva") || [];
  const prescrizioniRicevute = prescrizioni?.filter((p: any) => p.stato === "ricevuta") || [];
  const totalPazienti = pazienti?.length || 0;
  const totalPrescrizioni = prescrizioni?.length || 0;

  const oggi = new Date();
  const inizioMese = new Date(oggi.getFullYear(), oggi.getMonth(), 1);
  const prescrizioniQuestoMese = prescrizioni?.filter((p: any) => {
    const dataEmissione = new Date(p.dataEmissione);
    return dataEmissione >= inizioMese;
  }).length || 0;

  const farmaciPrescritti: Record<string, number> = {};
  prescrizioni?.forEach((p: any) => {
    if (p.farmaci && Array.isArray(p.farmaci)) {
      p.farmaci.forEach((f: any) => {
        const nomeFarmaco = f.nomeFarmaco || f.nome || "Sconosciuto";
        farmaciPrescritti[nomeFarmaco] = (farmaciPrescritti[nomeFarmaco] || 0) + 1;
      });
    }
  });
  const farmaciPiuPrescritti = Object.entries(farmaciPrescritti)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nome, count]) => ({ nome, count }));

  return (
    <div className="space-y-6 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border border-primary/20"
      >
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Dashboard Medico (Completa)
            </h1>
            <p className="text-gray-600 mt-2">
              Benvenuto, Dr. {profile?.nome} {profile?.cognome}
            </p>
            {profile?.specializzazione && (
              <Badge variant="outline" className="mt-2">
                {profile.specializzazione}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/medico/prescrizioni/nuova">
              <Button className="hover-lift">
                Nuova Prescrizione
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/medico/analytics">
              <Button variant="outline">Analytics</Button>
            </Link>
            <Link href="/medico/dashboard">
              <Button variant="ghost">Mini Dashboard</Button>
            </Link>
          </div>
        </div>
        <div className="absolute inset-0 shimmer opacity-30" />
      </motion.div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <StatCard
          title="Pazienti"
          value={totalPazienti}
          description="Pazienti associati"
          icon={User}
          variant="gradient"
          delay={0.1}
          className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-transparent"
        />
        <StatCard
          title="Prescrizioni Attive"
          value={prescrizioniAttive.length}
          description={`di ${totalPrescrizioni} totali`}
          icon={FileText}
          variant="gradient"
          delay={0.2}
          className="border-green-200 bg-gradient-to-br from-green-50/50 to-transparent"
        />
        <StatCard
          title="Richieste in Attesa"
          value={richiesteInAttesa}
          description="Richieste da approvare"
          icon={ClipboardList}
          variant="gradient"
          delay={0.3}
          className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-transparent"
        />
        <StatCard
          title="Questo Mese"
          value={prescrizioniQuestoMese}
          description="Prescrizioni emesse"
          icon={Calendar}
          variant="gradient"
          delay={0.4}
          className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-transparent"
        />

        <Card className="hover:shadow-lg transition-shadow border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescrizioni Ricevute</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
              <FileText className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{prescrizioniRicevute.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In attesa di attivazione</p>
            {prescrizioniRicevute.length > 0 && (
              <Badge variant="outline" className="mt-2 bg-orange-100 text-orange-800 border-orange-200">
                <Activity className="h-3 w-3 mr-1" />
                Da gestire
              </Badge>
            )}
          </CardContent>
        </Card>

        <Link href="/medico/richieste-prescrizione">
          <Card className="hover:shadow-lg transition-shadow border-yellow-200 bg-yellow-50/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Richieste Prescrizione</CardTitle>
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{richiesteInAttesa}</div>
              <p className="text-xs text-muted-foreground mt-1">In attesa di approvazione</p>
              {richiesteInAttesa > 0 && (
                <Badge variant="outline" className="mt-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Activity className="h-3 w-3 mr-1" />
                  Da gestire
                </Badge>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href="/medico/richieste-rinnovo">
          <Card className="hover:shadow-lg transition-shadow border-blue-200 bg-blue-50/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Richieste Rinnovo</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <RefreshCw className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{richiesteRinnovoInAttesa}</div>
              <p className="text-xs text-muted-foreground mt-1">In attesa di approvazione</p>
              {richiesteRinnovoInAttesa > 0 && (
                <Badge variant="outline" className="mt-2 bg-blue-100 text-blue-800 border-blue-200">
                  <Activity className="h-3 w-3 mr-1" />
                  Da gestire
                </Badge>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {richiesteInAttesa > 0 && (
        <Card className="border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-orange-600 animate-pulse" />
                <CardTitle className="text-xl text-orange-700">
                  Richieste Prescrizione in Attesa
                </CardTitle>
              </div>
              <Badge className="bg-orange-600 text-white text-lg px-4 py-1 animate-pulse">
                {richiesteInAttesa} {richiesteInAttesa === 1 ? "richiesta" : "richieste"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {richiestePrescrizione?.filter((r: any) => r.stato === "in_attesa").slice(0, 3).map((richiesta: any) => (
                <div
                  key={richiesta.id}
                  className="p-4 rounded-lg border-2 border-orange-200 bg-white hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <p className="font-medium text-sm">
                          {richiesta.paziente?.nome} {richiesta.paziente?.cognome}
                        </p>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                          In attesa
                        </Badge>
                      </div>
                      {richiesta.motivo && (
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Motivo:</span> {richiesta.motivo}
                        </p>
                      )}
                      {richiesta.farmaciRichiesti && Array.isArray(richiesta.farmaciRichiesti) && richiesta.farmaciRichiesti.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {richiesta.farmaciRichiesti.slice(0, 3).map((farmaco: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {farmaco.nomeFarmaco || "Farmaco"}
                            </Badge>
                          ))}
                          {richiesta.farmaciRichiesti.length > 3 && (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600">
                              +{richiesta.farmaciRichiesti.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      {richiesta.fotoTalloncinoUrl && (
                        <div className="mt-3 flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">Foto talloncino disponibile</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                              const imageUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010"}${richiesta.fotoTalloncinoUrl}`;
                              window.open(imageUrl, "_blank");
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Visualizza
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Richiesta del {new Date(richiesta.dataCreazione || richiesta.createdAt).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/medico/richieste-prescrizione/${richiesta.id}`}>
                        <Button size="sm" className="w-full">
                          Gestisci
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {richiesteInAttesa > 3 && (
                <div className="text-center pt-2">
                  <Link href="/medico/richieste-prescrizione?stato=in_attesa">
                    <Button variant="outline" className="w-full">
                      Vedi tutte le {richiesteInAttesa} richieste
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {farmaciPiuPrescritti.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-600" />
              <CardTitle>Farmaci Più Prescritti</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {farmaciPiuPrescritti.map((farmaco, index) => (
                <div key={farmaco.nome} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    <span className="text-sm font-medium">{farmaco.nome}</span>
                  </div>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                    {farmaco.count} {farmaco.count === 1 ? "prescrizione" : "prescrizioni"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <CardTitle>Filtri</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Filtra Prescrizioni</label>
              <Select value={filtroPrescrizioniMedico} onValueChange={setFiltroPrescrizioniMedico}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutte">Tutte</SelectItem>
                  <SelectItem value="attive">Attive</SelectItem>
                  <SelectItem value="scadute">Scadute</SelectItem>
                  <SelectItem value="ricevute">Ricevute</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Filtra Pazienti</label>
              <Select value={filtroPazienti} onValueChange={setFiltroPazienti}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti</SelectItem>
                  <SelectItem value="con_prescrizioni">Con Prescrizioni</SelectItem>
                  <SelectItem value="senza_prescrizioni">Senza Prescrizioni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ultime Prescrizioni</CardTitle>
          <Link href="/medico/prescrizioni">
            <Button variant="ghost" size="sm">
              Vedi tutte
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {prescrizioni && prescrizioni.length > 0 ? (
            <div className="space-y-3">
              {(filtroPrescrizioniMedico === "tutte"
                ? prescrizioni
                : prescrizioni.filter((p: any) => {
                    if (filtroPrescrizioniMedico === "attive") return p.stato === "attiva";
                    if (filtroPrescrizioniMedico === "scadute") return p.stato === "scaduta";
                    if (filtroPrescrizioniMedico === "ricevute") return p.stato === "ricevuta";
                    return true;
                  })
              ).slice(0, 5).map((prescrizione: any) => (
                <div
                  key={prescrizione.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {prescrizione.numeroRicetta || `#${prescrizione.id}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(prescrizione.dataEmissione).toLocaleDateString("it-IT")}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {prescrizione.stato}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">
              Nessuna prescrizione
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
