"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import {
  CreditCard,
  Coins,
  Crown,
  Truck,
  Store,
  Check,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface AbbonamentoInfo {
  haCrediti: boolean;
  creditiRimanenti: number;
  abbonamentoAttivo: boolean;
  abbonamentoTipo?: string;
  abbonamentoScadenza?: string;
}

interface RitiroInfo {
  puoRitirare: boolean;
  consegneDomicilio: number;
  ritiriFarmacia: number;
  messaggio?: string;
}

interface CartaSalvata {
  id: number;
  ultime4Cifre: string;
  tipoCarta: string;
  scadenza: string;
  predefinita: boolean;
}

const PACCHETTI_CREDITI = [
  { crediti: 5, prezzo: 25, label: "5 Crediti" },
  { crediti: 10, prezzo: 45, label: "10 Crediti", popolare: true },
  { crediti: 20, prezzo: 80, label: "20 Crediti" },
];

const PIANI_ABBONAMENTO = [
  {
    tipo: "mensile" as const,
    prezzo: 9.99,
    label: "Mensile",
    descrizione: "Rinnovo automatico ogni mese",
  },
  {
    tipo: "annuale" as const,
    prezzo: 99.99,
    label: "Annuale",
    descrizione: "Risparmia oltre il 15%",
    popolare: true,
  },
];

export default function AbbonamentoPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCarta, setSelectedCarta] = useState<number | null>(null);

  const { data: info, isLoading: infoLoading } = useQuery<AbbonamentoInfo>({
    queryKey: ["abbonamento-info"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AbbonamentoInfo>>(
        "/paziente/abbonamento/info"
      );
      return response.data.data;
    },
  });

  const { data: ritiroInfo } = useQuery<RitiroInfo>({
    queryKey: ["ritiro-farmacia-info"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RitiroInfo>>(
        "/paziente/puo-ritirare-farmacia"
      );
      return response.data.data;
    },
  });

  const { data: carte } = useQuery<CartaSalvata[]>({
    queryKey: ["payment", "carte"],
    queryFn: async () => {
      const response = await api.get("/paziente/payments/carte");
      return response.data.data;
    },
  });

  const abbonamentoMutation = useMutation({
    mutationFn: async (tipoAbbonamento: "mensile" | "annuale") => {
      const response = await api.post("/paziente/payments/abbonamento", {
        tipoAbbonamento,
        cartaId: selectedCarta,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abbonamento-info"] });
      toast({
        title: "Abbonamento attivato",
        description: "Il tuo abbonamento è stato attivato con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description:
          error.response?.data?.message ||
          "Errore nell'attivazione dell'abbonamento",
        variant: "destructive",
      });
    },
  });

  const creditiMutation = useMutation({
    mutationFn: async (importoCrediti: number) => {
      const response = await api.post("/paziente/payments/crediti", {
        importoCrediti,
        cartaId: selectedCarta,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abbonamento-info"] });
      toast({
        title: "Crediti acquistati",
        description: "I crediti sono stati aggiunti al tuo account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description:
          error.response?.data?.message ||
          "Errore nell'acquisto dei crediti",
        variant: "destructive",
      });
    },
  });

  if (infoLoading) {
    return <Loading />;
  }

  const carteSalvate = carte || [];
  const cartaSelezionata =
    selectedCarta || carteSalvate.find((c) => c.predefinita)?.id || null;

  const abbonamentoScaduto =
    info?.abbonamentoScadenza &&
    new Date(info.abbonamentoScadenza) < new Date();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent p-6 border border-amber-500/20"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
            Abbonamento & Crediti
          </h1>
          <p className="text-gray-600 mt-2">
            Gestisci il tuo piano e i crediti per le consegne
          </p>
        </div>
      </motion.div>

      {/* Stato attuale - griglia stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Crediti */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Coins className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Crediti Rimanenti</p>
                  <p className="text-3xl font-bold">
                    {info?.creditiRimanenti ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Abbonamento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    info?.abbonamentoAttivo && !abbonamentoScaduto
                      ? "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  <Crown
                    className={`h-6 w-6 ${
                      info?.abbonamentoAttivo && !abbonamentoScaduto
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Abbonamento</p>
                  {info?.abbonamentoAttivo && !abbonamentoScaduto ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          {info.abbonamentoTipo?.toUpperCase()}
                        </Badge>
                      </div>
                      {info.abbonamentoScadenza && (
                        <p className="text-xs text-gray-500 mt-1">
                          Scade il{" "}
                          {new Date(
                            info.abbonamentoScadenza
                          ).toLocaleDateString("it-IT")}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm font-medium text-gray-700">
                      Non attivo
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ritiro farmacia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    ritiroInfo?.puoRitirare ? "bg-purple-100" : "bg-gray-100"
                  }`}
                >
                  <Store
                    className={`h-6 w-6 ${
                      ritiroInfo?.puoRitirare
                        ? "text-purple-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ritiro in Farmacia</p>
                  {ritiroInfo?.puoRitirare ? (
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                      Disponibile
                    </Badge>
                  ) : (
                    <p className="text-xs text-gray-500">
                      {ritiroInfo?.consegneDomicilio ?? 0} consegne /{" "}
                      {ritiroInfo?.ritiriFarmacia ?? 0} ritiri
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Selezione carta per pagamento */}
      {carteSalvate.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Carta di pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {carteSalvate.map((carta) => (
                  <button
                    key={carta.id}
                    onClick={() => setSelectedCarta(carta.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      (cartaSelezionata === carta.id)
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                      {carta.tipoCarta} •••• {carta.ultime4Cifre}
                    </span>
                    {carta.predefinita && (
                      <Badge variant="outline" className="text-xs">
                        Predefinita
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
              <Link
                href="/paziente/carte"
                className="text-sm text-primary hover:underline mt-3 inline-flex items-center gap-1"
              >
                Gestisci carte <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {carteSalvate.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <CreditCard className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-3">
                Aggiungi una carta per acquistare crediti o abbonamenti
              </p>
              <Link href="/paziente/carte">
                <Button variant="outline">
                  Aggiungi Carta <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Piani Abbonamento */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          Piani Abbonamento
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {PIANI_ABBONAMENTO.map((piano) => (
            <Card
              key={piano.tipo}
              className={`relative ${
                piano.popolare ? "border-amber-400 shadow-md" : ""
              }`}
            >
              {piano.popolare && (
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-amber-500 text-white hover:bg-amber-500">
                    Consigliato
                  </Badge>
                </div>
              )}
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold">{piano.label}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {piano.descrizione}
                </p>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {piano.prezzo.toFixed(2).replace(".", ",")}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">
                    /{piano.tipo === "mensile" ? "mese" : "anno"}
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Consegne illimitate incluse
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Ritiro in farmacia
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Priorità nelle consegne
                  </li>
                </ul>
                <Button
                  className="w-full mt-4"
                  variant={piano.popolare ? "default" : "outline"}
                  disabled={
                    !cartaSelezionata || abbonamentoMutation.isPending
                  }
                  onClick={() => abbonamentoMutation.mutate(piano.tipo)}
                >
                  {abbonamentoMutation.isPending
                    ? "Elaborazione..."
                    : info?.abbonamentoAttivo && !abbonamentoScaduto
                    ? "Rinnova"
                    : "Attiva"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Pacchetti Crediti */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Coins className="h-5 w-5 text-blue-500" />
          Acquista Crediti
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Ogni credito equivale a una consegna gratuita
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {PACCHETTI_CREDITI.map((pacchetto) => (
            <Card
              key={pacchetto.crediti}
              className={`relative ${
                pacchetto.popolare ? "border-blue-400 shadow-md" : ""
              }`}
            >
              {pacchetto.popolare && (
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-blue-500 text-white hover:bg-blue-500">
                    Popolare
                  </Badge>
                </div>
              )}
              <CardContent className="pt-6 text-center">
                <div className="p-4 bg-blue-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-blue-600">
                    {pacchetto.crediti}
                  </span>
                </div>
                <h3 className="font-semibold">{pacchetto.label}</h3>
                <p className="text-2xl font-bold mt-2">
                  {pacchetto.prezzo.toFixed(2).replace(".", ",")}
                </p>
                <p className="text-xs text-gray-500">
                  {(pacchetto.prezzo / pacchetto.crediti)
                    .toFixed(2)
                    .replace(".", ",")}{" "}
                  / credito
                </p>
                <Button
                  className="w-full mt-4"
                  variant={pacchetto.popolare ? "default" : "outline"}
                  disabled={
                    !cartaSelezionata || creditiMutation.isPending
                  }
                  onClick={() =>
                    creditiMutation.mutate(pacchetto.prezzo)
                  }
                >
                  {creditiMutation.isPending
                    ? "Elaborazione..."
                    : "Acquista"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
