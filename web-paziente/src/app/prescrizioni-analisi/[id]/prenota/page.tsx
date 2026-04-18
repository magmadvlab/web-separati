"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ArrowLeft, Calendar, MapPin, Euro, CreditCard } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";

export default function PrenotaEsamePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prescrizioneAnalisiId = parseInt(params.id as string);

  const [laboratorioId, setLaboratorioId] = useState<number | null>(null);
  const [servizioId, setServizioId] = useState<number | null>(null);
  const [dataOraAppuntamento, setDataOraAppuntamento] = useState<string>("");
  const [tipoPagamento, setTipoPagamento] = useState<"SSN" | "privato" | "misto">("SSN");
  const [consegnaDomicilio, setConsegnaDomicilio] = useState<boolean>(false);
  const [indirizzoConsegna, setIndirizzoConsegna] = useState<string>("");
  const [finestraOraria, setFinestraOraria] = useState<string>("");
  const [notePaziente, setNotePaziente] = useState<string>("");

  // Carica prescrizione analisi
  const { data: prescrizioneAnalisi, isLoading: prescrizioneLoading } = useQuery({
    queryKey: ["prescrizione-analisi", prescrizioneAnalisiId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(
        `/paziente/prescrizioni-analisi/${prescrizioneAnalisiId}`
      );
      return response.data.data;
    },
    enabled: !!prescrizioneAnalisiId,
  });

  // Carica laboratori disponibili
  const { data: laboratori } = useQuery<any[]>({
    queryKey: ["laboratori-disponibili"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any[]>>("/paziente/laboratori/disponibili");
      return response.data.data || [];
    },
  });

  // Carica servizi del laboratorio selezionato
  const { data: servizi } = useQuery<any[]>({
    queryKey: ["servizi-laboratorio", laboratorioId],
    queryFn: async () => {
      if (!laboratorioId) return [];
      const response = await api.get<ApiResponse<any[]>>(
        `/paziente/laboratori/${laboratorioId}/servizi`
      );
      return response.data.data || [];
    },
    enabled: !!laboratorioId,
  });

  // Carica profilo paziente per indirizzo
  const { data: pazienteProfile } = useQuery({
    queryKey: ["paziente-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>("/paziente/profile");
      return response.data.data;
    },
  });

  // Pre-compila indirizzo
  useEffect(() => {
    if (pazienteProfile && !indirizzoConsegna && consegnaDomicilio) {
      const indirizzoCompleto = `${pazienteProfile.indirizzo}, ${pazienteProfile.cap} ${pazienteProfile.citta} (${pazienteProfile.provincia})`;
      setIndirizzoConsegna(indirizzoCompleto);
    }
  }, [pazienteProfile, consegnaDomicilio, indirizzoConsegna]);

  // Mutation per creare prenotazione
  const createPrenotazioneMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>(
        "/paziente/prenotazioni-esame",
        data
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Prenotazione creata con successo!",
        description: `Prenotazione #${data.codicePrenotazione} creata correttamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ["prenotazioni-esame"] });
      
      // Se richiede pagamento anticipato, reindirizza al pagamento
      if (data.pagamentoAnticipato && data.statoPagamento === 'pending') {
        router.push(`/prenotazioni-esame/${data.id}/pagamento`);
      } else {
        router.push(`/prenotazioni-esame/${data.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description:
          error.response?.data?.error?.message || "Errore durante la creazione della prenotazione",
        variant: "destructive",
      });
    },
  });

  // Calcola importi in base al tipo pagamento
  const servizio = servizi?.find((s) => s.id === servizioId);
  const importoTotale = servizio
    ? tipoPagamento === "SSN"
      ? Number(servizio.prezzoConvenzionato || 0)
      : tipoPagamento === "privato"
      ? Number(servizio.prezzoBase || 0)
      : Number(servizio.prezzoBase || 0) // Misto: totale
    : 0;
  const importoSSN = servizio && tipoPagamento === "misto" ? Number(servizio.prezzoConvenzionato || 0) : null;
  const importoPrivato = servizio && tipoPagamento !== "SSN" ? Number(servizio.prezzoBase || 0) - Number(servizio.prezzoConvenzionato || 0) : null;

  const handleSubmit = () => {
    if (!laboratorioId) {
      toast({
        title: "Attenzione",
        description: "Seleziona un laboratorio",
        variant: "destructive",
      });
      return;
    }

    if (!servizioId) {
      toast({
        title: "Attenzione",
        description: "Seleziona un servizio/esame",
        variant: "destructive",
      });
      return;
    }

    if (!dataOraAppuntamento) {
      toast({
        title: "Attenzione",
        description: "Seleziona data e ora dell'appuntamento",
        variant: "destructive",
      });
      return;
    }

    if (consegnaDomicilio && !indirizzoConsegna.trim()) {
      toast({
        title: "Attenzione",
        description: "Inserisci un indirizzo di consegna",
        variant: "destructive",
      });
      return;
    }

    createPrenotazioneMutation.mutate({
      prescrizioneAnalisiId: prescrizioneAnalisiId,
      laboratorioId,
      servizioId,
      dataOraAppuntamento: new Date(dataOraAppuntamento).toISOString(),
      tipoPagamento,
      consegnaDomicilio,
      indirizzoConsegna: consegnaDomicilio ? indirizzoConsegna.trim() : undefined,
      finestraOraria: finestraOraria?.trim() || undefined,
      notePaziente: notePaziente?.trim() || undefined,
    });
  };

  if (prescrizioneLoading) {
    return <Loading />;
  }

  if (!prescrizioneAnalisi) {
    return <NotFound message="Prescrizione analisi non trovata" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/prescrizioni-analisi/${prescrizioneAnalisiId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla prescrizione
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Prenota Esame</h1>
          <p className="text-gray-600 mt-1">
            Prenota l'esame prescritto dal medico
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form principale */}
        <div className="md:col-span-2 space-y-6">
          {/* Selezione Laboratorio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Seleziona Laboratorio
              </CardTitle>
            </CardHeader>
            <CardContent>
              {laboratori && laboratori.length > 0 ? (
                <div className="space-y-3">
                  {laboratori.map((laboratorio) => (
                    <div
                      key={laboratorio.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        laboratorioId === laboratorio.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setLaboratorioId(laboratorio.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{laboratorio.nome}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {laboratorio.indirizzo}, {laboratorio.citta}
                          </p>
                          {laboratorio.telefono && (
                            <p className="text-xs text-gray-500 mt-1">
                              Tel: {laboratorio.telefono}
                            </p>
                          )}
                          {laboratorio.convenzionato && (
                            <p className="text-xs text-green-600 mt-1">
                              Convenzionato SSN
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 text-center py-4">
                  Nessun laboratorio disponibile
                </p>
              )}
            </CardContent>
          </Card>

          {/* Selezione Servizio */}
          {laboratorioId && (
            <Card>
              <CardHeader>
                <CardTitle>Seleziona Servizio/Esame</CardTitle>
              </CardHeader>
              <CardContent>
                {servizi && servizi.length > 0 ? (
                  <div className="space-y-3">
                    {servizi.map((servizio) => (
                      <div
                        key={servizio.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          servizioId === servizio.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setServizioId(servizio.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{servizio.nome}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {servizio.tipoServizio}
                            </p>
                            {servizio.prezzoBase && (
                              <p className="text-sm font-semibold text-blue-700 mt-1">
                                €{Number(servizio.prezzoBase).toFixed(2)}
                                {servizio.prezzoConvenzionato && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    (SSN: €{Number(servizio.prezzoConvenzionato).toFixed(2)})
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-4">
                    Nessun servizio disponibile per questo laboratorio
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Data e Ora Appuntamento */}
          {servizioId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Data e Ora Appuntamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Data e Ora</Label>
                  <Input
                    type="datetime-local"
                    value={dataOraAppuntamento}
                    onChange={(e) => setDataOraAppuntamento(e.target.value)}
                    className="mt-2"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="mt-4">
                  <Label>Finestra Oraria (opzionale)</Label>
                  <Input
                    value={finestraOraria}
                    onChange={(e) => setFinestraOraria(e.target.value)}
                    placeholder="es: 14:00 - 18:00"
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tipo Pagamento */}
          {servizioId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Tipo Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label>Tipo Pagamento</Label>
                  <Select
                    value={tipoPagamento}
                    onValueChange={(v: any) => setTipoPagamento(v)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SSN">
                        SSN (Solo Ticket - Pagamento Differito)
                      </SelectItem>
                      <SelectItem value="privato">
                        Privato (Pagamento Anticipato)
                      </SelectItem>
                      <SelectItem value="misto">
                        Misto (SSN + Privato)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {tipoPagamento === "SSN" && (
                    <p className="text-xs text-gray-600 mt-2">
                      Il ticket SSN verrà pagato alla consegna dei risultati
                    </p>
                  )}
                  {tipoPagamento === "privato" && (
                    <p className="text-xs text-gray-600 mt-2">
                      Pagamento anticipato obbligatorio
                    </p>
                  )}
                  {tipoPagamento === "misto" && (
                    <p className="text-xs text-gray-600 mt-2">
                      Parte privata anticipata, ticket SSN alla consegna
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consegna Domicilio */}
          {servizioId && (
            <Card>
              <CardHeader>
                <CardTitle>Opzioni Consegna</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consegna-domicilio"
                    checked={consegnaDomicilio}
                    onCheckedChange={(checked) =>
                      setConsegnaDomicilio(checked === true)
                    }
                  />
                  <Label htmlFor="consegna-domicilio">
                    Consegna risultati a domicilio
                  </Label>
                </div>
                {consegnaDomicilio && (
                  <div>
                    <Label>Indirizzo Consegna</Label>
                    <Input
                      value={indirizzoConsegna}
                      onChange={(e) => setIndirizzoConsegna(e.target.value)}
                      placeholder="Indirizzo completo"
                      className="mt-2"
                    />
                  </div>
                )}
                <div>
                  <Label>Note (opzionale)</Label>
                  <Input
                    value={notePaziente}
                    onChange={(e) => setNotePaziente(e.target.value)}
                    placeholder="Note per il laboratorio"
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          {servizioId && (
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={createPrenotazioneMutation.isPending}
            >
              {createPrenotazioneMutation.isPending
                ? "Creazione prenotazione..."
                : "Crea Prenotazione"}
            </Button>
          )}
        </div>

        {/* Sidebar Riepilogo */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Riepilogo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {prescrizioneAnalisi && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Prescrizione:</p>
                  <p className="text-sm font-medium">
                    Analisi: {Array.isArray(prescrizioneAnalisi.analisi) 
                      ? prescrizioneAnalisi.analisi.join(", ")
                      : "N/A"}
                  </p>
                </div>
              )}

              {servizio && (
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Servizio:</span>
                    <span className="font-medium">{servizio.nome}</span>
                  </div>
                  {tipoPagamento === "SSN" && servizio.prezzoConvenzionato && (
                    <div className="flex justify-between text-sm">
                      <span>Ticket SSN:</span>
                      <span className="font-medium">
                        €{Number(servizio.prezzoConvenzionato).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {tipoPagamento === "privato" && servizio.prezzoBase && (
                    <div className="flex justify-between text-sm">
                      <span>Importo Privato:</span>
                      <span className="font-medium">
                        €{Number(servizio.prezzoBase).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {tipoPagamento === "misto" && (
                    <>
                      {importoSSN && (
                        <div className="flex justify-between text-sm">
                          <span>Ticket SSN:</span>
                          <span className="font-medium">
                            €{importoSSN.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {importoPrivato && (
                        <div className="flex justify-between text-sm">
                          <span>Importo Privato:</span>
                          <span className="font-medium">
                            €{importoPrivato.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Totale:</span>
                    <span>€{importoTotale.toFixed(2)}</span>
                  </div>
                  {tipoPagamento === "misto" && (
                    <p className="text-xs text-gray-600 mt-2">
                      Parte privata da pagare ora, ticket alla consegna
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

