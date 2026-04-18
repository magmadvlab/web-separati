"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { 
  Plus, 
  Minus, 
  Truck, 
  Clock, 
  AlertTriangle, 
  User, 
  MapPin,
  Package,
  Stethoscope,
  Euro,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";

const farmacoSchema = z.object({
  nomeFarmaco: z.string().min(1, "Nome farmaco richiesto"),
  quantita: z.number().min(1, "Quantità deve essere almeno 1"),
  principioAttivo: z.string().optional(),
  posologia: z.string().optional(),
  prezzoStimato: z.number().optional(),
});

const deliveryRequestSchema = z.object({
  pazienteId: z.number().min(1, "Seleziona un paziente"),
  prescrizioneId: z.number().optional(),
  farmaciRichiesti: z.array(farmacoSchema).min(1, "Aggiungi almeno un farmaco"),
  indirizzoConsegna: z.string().min(5, "Indirizzo consegna richiesto"),
  livelloUrgenza: z.enum(["normale", "urgente", "critico"]),
  finestraOraria: z.string().optional(),
  noteMedico: z.string().optional(),
});

type DeliveryRequestForm = z.infer<typeof deliveryRequestSchema>;

interface Paziente {
  id: number;
  nome: string;
  cognome: string;
  indirizzo: string;
  citta: string;
  telefono: string;
}

interface DirectDeliveryRequest {
  id: number;
  paziente: { nome: string; cognome: string };
  farmaciRichiesti: any[];
  indirizzoConsegna: string;
  livelloUrgenza: string;
  stato: string;
  costoStimato: number;
  dataRichiesta: string;
  riderAssegnato?: { nome: string; cognome: string; telefono: string };
}

export default function DeliveryDirettoPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<DeliveryRequestForm>({
    resolver: zodResolver(deliveryRequestSchema),
    defaultValues: {
      farmaciRichiesti: [{ nomeFarmaco: "", quantita: 1 }],
      livelloUrgenza: "normale",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "farmaciRichiesti",
  });

  // Query pazienti
  const { data: pazienti, isLoading: pazientiLoading } = useQuery<Paziente[]>({
    queryKey: ["medico-pazienti"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Paziente[]>>("/medico/pazienti");
      return response.data.data;
    },
  });

  // Query richieste delivery del medico
  const { data: richieste, isLoading: richiesteLoading } = useQuery<DirectDeliveryRequest[]>({
    queryKey: ["medico-delivery-requests"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<DirectDeliveryRequest[]>>("/direct-delivery/medico/richieste");
      return response.data.data;
    },
  });

  // Mutation per creare richiesta
  const createRequestMutation = useMutation({
    mutationFn: async (data: DeliveryRequestForm) => {
      const response = await api.post("/direct-delivery/medico/richieste", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medico-delivery-requests"] });
      toast({
        title: "Richiesta inviata",
        description: "La richiesta di delivery diretto è stata inviata con successo",
      });
      setShowForm(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'invio della richiesta",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DeliveryRequestForm) => {
    createRequestMutation.mutate(data);
  };

  const handlePazienteChange = (pazienteId: string) => {
    const paziente = pazienti?.find(p => p.id === parseInt(pazienteId));
    if (paziente) {
      form.setValue("indirizzoConsegna", `${paziente.indirizzo}, ${paziente.citta}`);
    }
  };

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'richiesta': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assegnata': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_corso': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completata': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgenza: string) => {
    switch (urgenza) {
      case 'critico': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgente': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (pazientiLoading || richiesteLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Diretto</h1>
          <p className="text-gray-600 mt-2">
            Richiedi consegna farmaci direttamente ai pazienti senza passare per la farmacia
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuova Richiesta
        </Button>
      </div>

      {/* Form Nuova Richiesta */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                Nuova Richiesta Delivery Diretto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Paziente */}
                    <FormField
                      control={form.control}
                      name="pazienteId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Paziente
                          </FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(parseInt(value));
                              handlePazienteChange(value);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleziona paziente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {pazienti?.map((paziente) => (
                                <SelectItem key={paziente.id} value={paziente.id.toString()}>
                                  {paziente.nome} {paziente.cognome} - {paziente.citta}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Livello Urgenza */}
                    <FormField
                      control={form.control}
                      name="livelloUrgenza"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Livello Urgenza
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="normale">Normale</SelectItem>
                              <SelectItem value="urgente">Urgente (+50% costo)</SelectItem>
                              <SelectItem value="critico">Critico (+100% costo)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Indirizzo Consegna */}
                  <FormField
                    control={form.control}
                    name="indirizzoConsegna"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Indirizzo Consegna
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Via, numero civico, città" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Finestra Oraria */}
                  <FormField
                    control={form.control}
                    name="finestraOraria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Finestra Oraria (opzionale)
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="es. 14:00-16:00" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Farmaci */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Farmaci da Consegnare
                      </FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ nomeFarmaco: "", quantita: 1 })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Aggiungi Farmaco
                      </Button>
                    </div>

                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name={`farmaciRichiesti.${index}.nomeFarmaco`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome Farmaco</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="es. Aspirina 500mg" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`farmaciRichiesti.${index}.quantita`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantità</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    min="1"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`farmaciRichiesti.${index}.posologia`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Posologia</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="es. 1 cp al giorno" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-end">
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Note Medico */}
                  <FormField
                    control={form.control}
                    name="noteMedico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note per il Delivery</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Istruzioni speciali, note sulla terapia, etc."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Azioni */}
                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      disabled={createRequestMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createRequestMutation.isPending ? "Invio..." : "Invia Richiesta"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowForm(false)}
                    >
                      Annulla
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Lista Richieste */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Le Tue Richieste Delivery ({richieste?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {richieste && richieste.length > 0 ? (
            <div className="space-y-4">
              {richieste.map((richiesta, index) => (
                <motion.div
                  key={richiesta.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-4 border rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <Badge className={getStatoColor(richiesta.stato)}>
                          {richiesta.stato.toUpperCase()}
                        </Badge>
                        <Badge className={getUrgencyColor(richiesta.livelloUrgenza)}>
                          {richiesta.livelloUrgenza.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(richiesta.dataRichiesta).toLocaleString('it-IT')}
                        </span>
                      </div>

                      {/* Paziente */}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          {richiesta.paziente.nome} {richiesta.paziente.cognome}
                        </span>
                      </div>

                      {/* Indirizzo */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">{richiesta.indirizzoConsegna}</span>
                      </div>

                      {/* Farmaci e Costo */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-600" />
                          <span className="text-sm">{richiesta.farmaciRichiesti.length} farmaci</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">
                            €{richiesta.costoStimato.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Rider assegnato */}
                      {richiesta.riderAssegnato && (
                        <div className="flex items-center gap-2 bg-green-50 p-2 rounded">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm">
                            Assegnato a: {richiesta.riderAssegnato.nome} {richiesta.riderAssegnato.cognome}
                          </span>
                          <span className="text-xs text-gray-600 ml-2">
                            Tel: {richiesta.riderAssegnato.telefono}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Azioni */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        Dettagli
                      </Button>
                      {richiesta.stato === 'richiesta' && (
                        <Button variant="outline" size="sm" className="text-red-600">
                          Annulla
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessuna richiesta delivery
              </h3>
              <p className="text-gray-600 mb-4">
                Non hai ancora fatto richieste di delivery diretto.
              </p>
              <Button onClick={() => setShowForm(true)}>
                Crea Prima Richiesta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}