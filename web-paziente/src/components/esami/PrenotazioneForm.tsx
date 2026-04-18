"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { Calendar, Clock, Euro, Truck, CheckCircle2 } from "lucide-react";

interface SlotDisponibili {
  dataOra: string;
  disponibile: boolean;
  prezzo?: number;
}

interface PrenotazioneFormProps {
  laboratorioId: number;
  servizioId: number;
  tipoServizio: string;
  consegnabile: boolean;
}

export function PrenotazioneForm({
  laboratorioId,
  servizioId,
  tipoServizio,
  consegnabile,
}: PrenotazioneFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dataSelezionata, setDataSelezionata] = useState("");
  const [slotSelezionato, setSlotSelezionato] = useState("");
  const [consegnaDomicilio, setConsegnaDomicilio] = useState(false);
  const [indirizzoConsegna, setIndirizzoConsegna] = useState("");
  const [note, setNote] = useState("");

  const { data: slots, isLoading: isLoadingSlots } = useQuery<SlotDisponibili[]>({
    queryKey: ["disponibilita", laboratorioId, servizioId, dataSelezionata],
    queryFn: async () => {
      if (!dataSelezionata) return [];
      const response = await api.get<ApiResponse<SlotDisponibili[]>>(
        `/salute/laboratori/${laboratorioId}/disponibilita?servizioId=${servizioId}&data=${dataSelezionata}`
      );
      return response.data.data || [];
    },
    enabled: !!dataSelezionata,
  });

  const creaPrenotazioneMutation = useMutation({
    mutationFn: async (data: {
      laboratorioId: number;
      servizioId: number;
      dataOraAppuntamento: string;
      consegnaDomicilio?: boolean;
      indirizzoConsegna?: string;
      note?: string;
    }) => {
      const response = await api.post<ApiResponse<any>>("/salute/prenotazioni", data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["prenotazioni"] });
      toast({
        title: "Prenotazione creata",
        description: `Codice prenotazione: ${data.codicePrenotazione}`,
      });
      router.push(`/paziente/esami/prenotazioni/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante la creazione della prenotazione",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotSelezionato) {
      toast({
        title: "Errore",
        description: "Seleziona uno slot disponibile",
        variant: "destructive",
      });
      return;
    }

    creaPrenotazioneMutation.mutate({
      laboratorioId,
      servizioId,
      dataOraAppuntamento: slotSelezionato,
      consegnaDomicilio: consegnabile ? consegnaDomicilio : false,
      indirizzoConsegna: consegnaDomicilio ? indirizzoConsegna : undefined,
      note: note || undefined,
    });
  };

  const oggi = new Date();
  const dataMinima = oggi.toISOString().split("T")[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prenota Appuntamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="data">Data Desiderata *</Label>
            <Input
              id="data"
              type="date"
              value={dataSelezionata}
              onChange={(e) => {
                setDataSelezionata(e.target.value);
                setSlotSelezionato("");
              }}
              min={dataMinima}
              required
            />
          </div>

          {isLoadingSlots && <Loading />}

          {slots && slots.length > 0 && (
            <div className="space-y-2">
              <Label>Slot Disponibili *</Label>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {slots
                  .filter((slot) => slot.disponibile)
                  .map((slot) => {
                    const dataOra = new Date(slot.dataOra);
                    const isSelected = slotSelezionato === slot.dataOra;
                    return (
                      <button
                        key={slot.dataOra}
                        type="button"
                        onClick={() => setSlotSelezionato(slot.dataOra)}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <Clock className="h-4 w-4" />
                              {dataOra.toLocaleTimeString("it-IT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            {slot.prezzo && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                <Euro className="h-3 w-3" />
                                {Number(slot.prezzo).toFixed(2)}
                              </div>
                            )}
                          </div>
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {slots && slots.length === 0 && dataSelezionata && (
            <p className="text-sm text-gray-500">Nessuno slot disponibile per questa data</p>
          )}

          {consegnabile && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consegnaDomicilio"
                  checked={consegnaDomicilio}
                  onCheckedChange={(checked) => setConsegnaDomicilio(checked === true)}
                />
                <Label htmlFor="consegnaDomicilio" className="flex items-center gap-2 cursor-pointer">
                  <Truck className="h-4 w-4" />
                  Consegna risultati a domicilio
                </Label>
              </div>

              {consegnaDomicilio && (
                <div className="space-y-2">
                  <Label htmlFor="indirizzoConsegna">Indirizzo Consegna *</Label>
                  <Input
                    id="indirizzoConsegna"
                    placeholder="Via, numero civico, CAP, città"
                    value={indirizzoConsegna}
                    onChange={(e) => setIndirizzoConsegna(e.target.value)}
                    required={consegnaDomicilio}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Note (opzionale)</Label>
            <Input
              id="note"
              placeholder="Note aggiuntive per il laboratorio"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            disabled={!slotSelezionato || creaPrenotazioneMutation.isPending}
            className="w-full"
          >
            {creaPrenotazioneMutation.isPending ? "Creazione..." : "Conferma Prenotazione"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


