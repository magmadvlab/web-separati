"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import type { ApiResponse, Prescrizione, Farmacia, Paziente } from "@/types/api";
import {
  ArrowLeft,
  ShoppingCart,
  MapPin,
  Truck,
  Package,
  Euro,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface FarmacoSelezionato {
  nomeFarmaco: string;
  quantita: number;
  prezzo?: number;
  farmacoId?: number;
}

export default function NuovoOrdinePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prescrizioneId = parseInt(params.id as string);

  // Stato form
  const [farmaciSelezionati, setFarmaciSelezionati] = useState<FarmacoSelezionato[]>([]);
  const [farmaciDaBancoSelezionati, setFarmaciDaBancoSelezionati] = useState<FarmacoSelezionato[]>([]);
  const [farmaciaSelezionata, setFarmaciaSelezionata] = useState<number | null>(null);
  const [tipoConsegna, setTipoConsegna] = useState<"domicilio" | "ritiro">("domicilio");
  const [indirizzoConsegna, setIndirizzoConsegna] = useState<string>("");
  const [finestraOraria, setFinestraOraria] = useState<string>("");
  const [noteConsegna, setNoteConsegna] = useState<string>("");

  // Carica profilo paziente per pre-compilare indirizzo
  const { data: pazienteProfile } = useQuery<Paziente>({
    queryKey: ["paziente-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Paziente>>("/paziente/profile");
      return response.data.data;
    },
  });

  // Pre-compila indirizzo quando il profilo viene caricato
  useEffect(() => {
    if (pazienteProfile && !indirizzoConsegna && tipoConsegna === "domicilio") {
      const indirizzoCompleto = `${pazienteProfile.indirizzo}, ${pazienteProfile.cap} ${pazienteProfile.citta} (${pazienteProfile.provincia})`;
      setIndirizzoConsegna(indirizzoCompleto);
    }
  }, [pazienteProfile, tipoConsegna, indirizzoConsegna]);

  // Carica prescrizione
  const { data: prescrizione, isLoading: prescrizioneLoading } = useQuery<Prescrizione>({
    queryKey: ["paziente-prescrizione", prescrizioneId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prescrizione>>(
        `/paziente/prescrizioni/${prescrizioneId}`
      );
      return response.data.data;
    },
    enabled: !!prescrizioneId,
  });

  // Carica farmacie vicine
  const { data: farmacie, isLoading: farmacieLoading } = useQuery<Farmacia[]>({
    queryKey: ["paziente-farmacie-vicine"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Farmacia[]>>(
        `/paziente/farmacie/vicine?raggioKm=10&limit=20`
      );
      return response.data.data;
    },
  });

  // Verifica se può ritirare in farmacia
  const { data: infoRitiroFarmacia } = useQuery({
    queryKey: ["puo-ritirare-farmacia"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>("/paziente/puo-ritirare-farmacia");
      return response.data.data;
    },
  });

  // Info abbonamento
  const { data: infoAbbonamento } = useQuery({
    queryKey: ["abbonamento-info"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>("/paziente/abbonamento/info");
      return response.data.data;
    },
  });

  // Carica prodotti correlati (accessori sanitari e farmaci da banco)
  const { data: prodottiCorrelati } = useQuery<any[]>({
    queryKey: ["prodotti-correlati", prescrizione?.farmaci],
    queryFn: async () => {
      if (!prescrizione?.farmaci) return [];
      const farmaci = Array.isArray(prescrizione.farmaci)
        ? prescrizione.farmaci
        : typeof prescrizione.farmaci === "string"
        ? JSON.parse(prescrizione.farmaci)
        : [];
      
      if (farmaci.length === 0) return [];
      
      // Prendi il primo farmaco per cercare prodotti correlati
      const primoFarmaco = farmaci[0];
      const farmacoId = primoFarmaco.farmacoId || primoFarmaco.id;
      const principioAttivo = primoFarmaco.principioAttivo;
      
      // Costruisci query string correttamente
      const params = new URLSearchParams();
      if (farmacoId) params.append('farmacoId', String(farmacoId));
      if (principioAttivo) params.append('principioAttivo', principioAttivo);
      
      // Se non ci sono parametri, non fare la chiamata
      if (params.toString().length === 0) {
        return [];
      }
      
      const response = await api.get<ApiResponse<any[]>>(
        `/paziente/farmaci/prodotti-correlati?${params.toString()}`
      );
      return response.data.data || [];
    },
    enabled: !!prescrizione,
  });

  // Carica farmaci OTC popolari
  const { data: farmaciOTC } = useQuery<any[]>({
    queryKey: ["farmaci-otc"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/paziente/farmaci/otc?limit=12");
      return response.data.data || [];
    },
  });

  // Inizializza farmaci selezionati quando la prescrizione viene caricata
  useEffect(() => {
    if (prescrizione?.farmaci && farmaciSelezionati.length === 0) {
      const farmaci = Array.isArray(prescrizione.farmaci)
        ? prescrizione.farmaci
        : typeof prescrizione.farmaci === "string"
        ? JSON.parse(prescrizione.farmaci)
        : [];

      setFarmaciSelezionati(
        farmaci.map((f: any) => ({
          nomeFarmaco: f.nomeFarmaco || f.nome || "Farmaco",
          quantita: f.quantita || 1,
          prezzo: f.prezzo,
          farmacoId: f.farmacoId || f.id,
        }))
      );
    }
  }, [prescrizione]);

  // Mutation per creare ordine
  const createOrdineMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>(
        "/paziente/ordini/da-prescrizione",
        data
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Ordine creato con successo!",
        description: `Ordine #${data.codiceOrdine} creato correttamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ["paziente-ordini"] });
      queryClient.invalidateQueries({ queryKey: ["paziente-prescrizioni"] });
      router.push(`/ordini/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description:
          error.response?.data?.error?.message || "Errore durante la creazione dell'ordine",
        variant: "destructive",
      });
    },
  });

  if (prescrizioneLoading || farmacieLoading) {
    return <Loading />;
  }

  if (!prescrizione) {
    return <NotFound message="Prescrizione non trovata" />;
  }

  // Parsa farmaci
  const farmaciPrescrizione = Array.isArray(prescrizione.farmaci)
    ? prescrizione.farmaci
    : typeof prescrizione.farmaci === "string"
    ? JSON.parse(prescrizione.farmaci)
    : [];

  // Calcola costi
  const totaleFarmaci = farmaciSelezionati.reduce(
    (sum, f) => sum + (f.prezzo || 0) * f.quantita,
    0
  );
  const totaleDaBanco = farmaciDaBancoSelezionati.reduce(
    (sum, f) => sum + (f.prezzo || 0) * f.quantita,
    0
  );
  const costoConsegna = tipoConsegna === "domicilio" ? 5.0 : 0.0;
  const totale = totaleFarmaci + totaleDaBanco + costoConsegna;

  // Handler per toggle farmaco
  const toggleFarmaco = (index: number, selezionato: boolean) => {
    if (selezionato) {
      // Già selezionato, non fare nulla
      return;
    } else {
      // Rimuovi farmaco
      setFarmaciSelezionati(farmaciSelezionati.filter((_, i) => i !== index));
    }
  };

  // Handler per aggiornare quantità
  const updateQuantita = (index: number, quantita: number) => {
    const updated = [...farmaciSelezionati];
    updated[index].quantita = Math.max(1, quantita);
    setFarmaciSelezionati(updated);
  };

  // Handler submit
  const handleSubmit = () => {
    if (farmaciSelezionati.length === 0) {
      toast({
        title: "Attenzione",
        description: "Seleziona almeno un farmaco",
        variant: "destructive",
      });
      return;
    }

    if (!farmaciaSelezionata) {
      toast({
        title: "Attenzione",
        description: "Seleziona una farmacia",
        variant: "destructive",
      });
      return;
    }

    // Validazione indirizzo per consegna a domicilio
    if (tipoConsegna === "domicilio" && !indirizzoConsegna.trim()) {
      toast({
        title: "Attenzione",
        description: "Inserisci un indirizzo di consegna per la consegna a domicilio",
        variant: "destructive",
      });
      return;
    }

    // Prepara farmaci con formato corretto
    const farmaciFormattati = farmaciSelezionati.map(f => ({
      nomeFarmaco: f.nomeFarmaco,
      quantita: Number(f.quantita) || 1,
      prezzo: f.prezzo ? Number(f.prezzo) : undefined,
      farmacoId: f.farmacoId ? Number(f.farmacoId) : undefined,
    }));

    // Prepara farmaci da banco se selezionati
    const farmaciDaBancoFormattati = farmaciDaBancoSelezionati.map(f => ({
      nomeFarmaco: f.nomeFarmaco,
      quantita: Number(f.quantita) || 1,
      prezzo: f.prezzo ? Number(f.prezzo) : undefined,
      farmacoId: f.farmacoId ? Number(f.farmacoId) : undefined,
    }));

    createOrdineMutation.mutate({
      prescrizioneId: prescrizioneId,
      farmaci: farmaciFormattati,
      farmaciDaBanco: farmaciDaBancoFormattati.length > 0 ? farmaciDaBancoFormattati : undefined,
      farmaciaId: farmaciaSelezionata,
      tipoConsegna,
      indirizzoConsegna: tipoConsegna === "domicilio" ? indirizzoConsegna.trim() : undefined,
      finestraOraria: finestraOraria?.trim() || undefined,
      noteConsegna: noteConsegna?.trim() || undefined,
    });
  };

  const farmacia = farmacie?.find((f) => f.id === farmaciaSelezionata);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/prescrizioni/${prescrizioneId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla prescrizione
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Crea Nuovo Ordine</h1>
          <p className="text-gray-600 mt-1">
            Da prescrizione #{prescrizione.numeroRicetta || prescrizioneId}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonna principale - Form */}
        <div className="md:col-span-2 space-y-6">
          {/* ✅ Task 3.3.2: Selezione Farmaci */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Seleziona Farmaci ({farmaciSelezionati.length}/{farmaciPrescrizione.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {farmaciPrescrizione.length > 0 ? (
                <div className="space-y-3">
                  {farmaciPrescrizione.map((farmaco: any, index: number) => {
                    const selezionato = farmaciSelezionati.some(
                      (f) => f.nomeFarmaco === (farmaco.nomeFarmaco || farmaco.nome)
                    );
                    const farmacoSelezionato = farmaciSelezionati.find(
                      (f) => f.nomeFarmaco === (farmaco.nomeFarmaco || farmaco.nome)
                    );

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          selezionato
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selezionato}
                            onCheckedChange={(checked) => toggleFarmaco(index, !!checked)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">
                              {farmaco.nomeFarmaco || farmaco.nome || "Farmaco"}
                            </p>
                            {farmaco.principioAttivo && (
                              <p className="text-sm text-gray-600 mt-1">
                                {farmaco.principioAttivo}
                              </p>
                            )}
                            {farmaco.posologia && (
                              <p className="text-xs text-gray-500 mt-1">
                                Posologia: {farmaco.posologia}
                              </p>
                            )}
                            {selezionato && farmacoSelezionato && (
                              <div className="mt-3 flex items-center gap-3">
                                <Label className="text-sm">Quantità:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={farmacoSelezionato.quantita}
                                  onChange={(e) =>
                                    updateQuantita(
                                      farmaciSelezionati.indexOf(farmacoSelezionato),
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-20"
                                />
                                {farmacoSelezionato.prezzo && (
                                  <span className="text-sm font-medium">
                                    €{(farmacoSelezionato.prezzo * farmacoSelezionato.quantita).toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">
                  Nessun farmaco nella prescrizione
                </p>
              )}
            </CardContent>
          </Card>

          {/* Shop Accessori Sanitari e Farmaci da Banco */}
          <Card className="border-green-200 bg-green-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <ShoppingCart className="h-5 w-5" />
                Accessori Sanitari e Farmaci da Banco
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Aggiungi prodotti correlati alla tua terapia o farmaci da banco
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prodotti Correlati */}
              {prodottiCorrelati && prodottiCorrelati.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-green-700">
                    Prodotti Consigliati per la Tua Terapia
                  </h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {prodottiCorrelati.map((prodotto: any) => {
                      const giaSelezionato = farmaciDaBancoSelezionati.some(
                        f => f.farmacoId === prodotto.id
                      );
                      return (
                        <div
                          key={prodotto.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            giaSelezionato
                              ? "border-green-500 bg-green-100"
                              : "border-gray-200 hover:border-green-300 bg-white"
                          }`}
                          onClick={() => {
                            if (giaSelezionato) {
                              setFarmaciDaBancoSelezionati(prev =>
                                prev.filter(f => f.farmacoId !== prodotto.id)
                              );
                            } else {
                              setFarmaciDaBancoSelezionati(prev => [
                                ...prev,
                                {
                                  nomeFarmaco: prodotto.nomeCommerciale,
                                  quantita: 1,
                                  prezzo: prodotto.prezzo ? Number(prodotto.prezzo) : undefined,
                                  farmacoId: prodotto.id,
                                },
                              ]);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{prodotto.nomeCommerciale}</p>
                              {prodotto.principioAttivo && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {prodotto.principioAttivo}
                                </p>
                              )}
                              {prodotto.prezzo && (
                                <p className="text-sm font-semibold text-green-700 mt-1">
                                  €{Number(prodotto.prezzo).toFixed(2)}
                                </p>
                              )}
                            </div>
                            {giaSelezionato && (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Farmaci OTC Popolari */}
              {farmaciOTC && farmaciOTC.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-green-700">
                    Farmaci da Banco Popolari
                  </h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {farmaciOTC.slice(0, 8).map((farmaco: any) => {
                      const giaSelezionato = farmaciDaBancoSelezionati.some(
                        f => f.farmacoId === farmaco.id
                      );
                      return (
                        <div
                          key={farmaco.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            giaSelezionato
                              ? "border-green-500 bg-green-100"
                              : "border-gray-200 hover:border-green-300 bg-white"
                          }`}
                          onClick={() => {
                            if (giaSelezionato) {
                              setFarmaciDaBancoSelezionati(prev =>
                                prev.filter(f => f.farmacoId !== farmaco.id)
                              );
                            } else {
                              setFarmaciDaBancoSelezionati(prev => [
                                ...prev,
                                {
                                  nomeFarmaco: farmaco.nomeCommerciale,
                                  quantita: 1,
                                  prezzo: farmaco.prezzo ? Number(farmaco.prezzo) : undefined,
                                  farmacoId: farmaco.id,
                                },
                              ]);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{farmaco.nomeCommerciale}</p>
                              {farmaco.principioAttivo && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {farmaco.principioAttivo}
                                </p>
                              )}
                              {farmaco.prezzo && (
                                <p className="text-sm font-semibold text-green-700 mt-1">
                                  €{Number(farmaco.prezzo).toFixed(2)}
                                </p>
                              )}
                            </div>
                            {giaSelezionato && (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Riepilogo prodotti selezionati */}
              {farmaciDaBancoSelezionati.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm font-medium mb-2">
                    Prodotti Selezionati ({farmaciDaBancoSelezionati.length})
                  </p>
                  <div className="space-y-1">
                    {farmaciDaBancoSelezionati.map((farmaco, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{farmaco.nomeFarmaco} x{farmaco.quantita}</span>
                        <span className="font-medium">
                          €{((farmaco.prezzo || 0) * farmaco.quantita).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ✅ Task 3.3.3: Selezione Farmacia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Seleziona Farmacia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {farmacie && farmacie.length > 0 ? (
                <div className="space-y-3">
                  {farmacie.map((farmacia) => (
                    <div
                      key={farmacia.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        farmaciaSelezionata === farmacia.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setFarmaciaSelezionata(farmacia.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{farmacia.nome}</p>
                            {farmaciaSelezionata === farmacia.id && (
                              <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {farmacia.indirizzo}, {farmacia.citta}
                          </p>
                          {farmacia.telefono && (
                            <p className="text-xs text-gray-500 mt-1">Tel: {farmacia.telefono}</p>
                          )}
                          {"distanzaKm" in farmacia && (
                            <p className="text-xs text-blue-600 mt-1">
                              Distanza: {farmacia.distanzaKm} km
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">
                  Nessuna farmacia disponibile
                </p>
              )}
            </CardContent>
          </Card>

          {/* ✅ Task 3.3.4: Tipo Consegna */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Opzioni Consegna
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo Consegna</Label>
                <Select value={tipoConsegna} onValueChange={(v: any) => setTipoConsegna(v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domicilio">
                      Consegna a Domicilio - FamaFast (Gratuita)
                    </SelectItem>
                    <SelectItem 
                      value="ritiro"
                      disabled={!infoRitiroFarmacia?.puoRitirare}
                    >
                      Ritiro in Farmacia
                      {!infoRitiroFarmacia?.puoRitirare && " (Non disponibile)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {infoRitiroFarmacia && !infoRitiroFarmacia.puoRitirare && (
                  <p className="text-xs text-orange-600 mt-2">
                    {infoRitiroFarmacia.messaggio}
                  </p>
                )}
                {infoRitiroFarmacia && infoRitiroFarmacia.puoRitirare && (
                  <p className="text-xs text-green-600 mt-2">
                    Puoi ritirare di persona in farmacia (1 volta ogni 6 consegne)
                  </p>
                )}
              </div>

              {/* Info Abbonamento */}
              {infoAbbonamento && infoAbbonamento.abbonamentoAttivo && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">Abbonamento Attivo</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Crediti rimanenti: {infoAbbonamento.creditiRimanenti}
                  </p>
                  {infoAbbonamento.abbonamentoScadenza && (
                    <p className="text-xs text-blue-700">
                      Scadenza: {new Date(infoAbbonamento.abbonamentoScadenza).toLocaleDateString('it-IT')}
                    </p>
                  )}
                </div>
              )}

              {tipoConsegna === "domicilio" && (
                <>
                  <div>
                    <Label>Indirizzo Consegna</Label>
                    <Input
                      value={indirizzoConsegna}
                      onChange={(e) => setIndirizzoConsegna(e.target.value)}
                      placeholder="Indirizzo completo"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Finestra Oraria (opzionale)</Label>
                    <Input
                      value={finestraOraria}
                      onChange={(e) => setFinestraOraria(e.target.value)}
                      placeholder="es: 14:00 - 18:00"
                      className="mt-2"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Note Consegna (opzionale)</Label>
                <Input
                  value={noteConsegna}
                  onChange={(e) => setNoteConsegna(e.target.value)}
                  placeholder="Note aggiuntive per la consegna"
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonna laterale - Riepilogo */}
        <div className="space-y-6">
          {/* ✅ Task 3.3.5: Preview Costi */}
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Riepilogo Ordine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Farmaci Selezionati:</p>
                <div className="space-y-1">
                  {farmaciSelezionati.map((f, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="truncate">{f.nomeFarmaco}</span>
                      <span className="ml-2 font-medium">
                        €{((f.prezzo || 0) * f.quantita).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {farmaciDaBancoSelezionati.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 mb-2">Prodotti da Banco:</p>
                  <div className="space-y-1">
                    {farmaciDaBancoSelezionati.map((f, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="truncate">{f.nomeFarmaco}</span>
                        <span className="ml-2 font-medium">
                          €{((f.prezzo || 0) * f.quantita).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Totale Farmaci:</span>
                  <span className="font-medium">€{totaleFarmaci.toFixed(2)}</span>
                </div>
                {farmaciDaBancoSelezionati.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Totale Da Banco:</span>
                    <span className="font-medium">
                      €{totaleDaBanco.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Costo Consegna:</span>
                  <span className="font-medium">€{costoConsegna.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Totale:</span>
                  <span>€{totale.toFixed(2)}</span>
                </div>
              </div>

              {farmacia && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-600 mb-1">Farmacia selezionata:</p>
                  <p className="text-sm font-medium">{farmacia.nome}</p>
                  <p className="text-xs text-gray-500">{farmacia.citta}</p>
                </div>
              )}

              {/* ✅ Task 3.3.6: Submit */}
              <Button
                className="w-full mt-4"
                onClick={handleSubmit}
                disabled={
                  createOrdineMutation.isPending ||
                  farmaciSelezionati.length === 0 ||
                  !farmaciaSelezionata
                }
              >
                {createOrdineMutation.isPending ? (
                  "Creazione in corso..."
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Crea Ordine
                  </>
                )}
              </Button>

              {farmaciSelezionati.length === 0 && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Seleziona almeno un farmaco
                </p>
              )}

              {!farmaciaSelezionata && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Seleziona una farmacia
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

