"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cartellaClinicaApi } from "@/lib/api-cartella-clinica";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import { Plus, Ruler, Thermometer, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { MisurazioneFebbre, MisurazioneAntropometrica, CreateMisurazioneFebbreDto, CreateMisurazioneAntropometricaDto, RegistrazioneStatoSalute } from "@/types/cartella-clinica";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const misurazioneSchema = z.object({
  tipo: z.enum(["peso", "altezza", "circonferenza_vita", "circonferenza_petto", "circonferenza_fianchi", "bmi"]),
  valore: z.number().min(0, "Il valore deve essere positivo"),
  unitaMisura: z.enum(["kg", "cm", "m"]),
  dataMisurazione: z.string().min(1, "Data misurazione richiesta"),
  note: z.string().optional(),
});

const febbreSchema = z.object({
  temperatura: z.number().min(35, "Temperatura non valida").max(42, "Temperatura non valida"),
  dataOra: z.string().min(1, "Data e ora richieste"),
  metodoMisurazione: z.enum(["ascellare", "orale", "retale", "timpano"]),
  sintomiAssociati: z.array(z.string()).optional(),
  note: z.string().optional(),
});

type MisurazioneFormValues = z.infer<typeof misurazioneSchema>;
type FebbreFormValues = z.infer<typeof febbreSchema>;

export function Misurazioni() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMisurazioneOpen, setIsMisurazioneOpen] = useState(false);
  const [isFebbreOpen, setIsFebbreOpen] = useState(false);
  const [selectedStatoId, setSelectedStatoId] = useState<number | null>(null);

  const misurazioneForm = useForm<MisurazioneFormValues>({
    resolver: zodResolver(misurazioneSchema),
    defaultValues: {
      tipo: "peso",
      valore: 0,
      unitaMisura: "kg",
      dataMisurazione: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const febbreForm = useForm<FebbreFormValues>({
    resolver: zodResolver(febbreSchema),
    defaultValues: {
      temperatura: 36.5,
      dataOra: new Date().toISOString().slice(0, 16),
      metodoMisurazione: "ascellare",
      sintomiAssociati: [],
      note: "",
    },
  });

  const { data: misurazioni, isLoading: isLoadingMisurazioni } = useQuery<MisurazioneAntropometrica[]>({
    queryKey: ["cartella-clinica-misurazioni"],
    queryFn: () => cartellaClinicaApi.getMisurazioni(),
  });

  const { data: storicoFebbre, isLoading: isLoadingFebbre } = useQuery<MisurazioneFebbre[]>({
    queryKey: ["cartella-clinica-febbre-storico"],
    queryFn: () => cartellaClinicaApi.getStoricoFebbre(),
  });

  const { data: statiSalute } = useQuery<RegistrazioneStatoSalute[]>({
    queryKey: ["cartella-clinica-stati-salute"],
    queryFn: () => cartellaClinicaApi.getStatiSalute(),
  });

  const createMisurazioneMutation = useMutation({
    mutationFn: (data: CreateMisurazioneAntropometricaDto) =>
      cartellaClinicaApi.registraMisurazione(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartella-clinica-misurazioni"] });
      toast({
        title: "Misurazione registrata",
        description: "La misurazione è stata registrata con successo",
      });
      setIsMisurazioneOpen(false);
      misurazioneForm.reset();
    },
  });

  const createFebbreMutation = useMutation({
    mutationFn: ({ statoId, data }: { statoId: number; data: CreateMisurazioneFebbreDto }) =>
      cartellaClinicaApi.registraMisurazioneFebbre(statoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartella-clinica-febbre-storico"] });
      queryClient.invalidateQueries({ queryKey: ["cartella-clinica-stati-salute"] });
      toast({
        title: "Misurazione febbre registrata",
        description: "La misurazione della febbre è stata registrata con successo",
      });
      setIsFebbreOpen(false);
      setSelectedStatoId(null);
      febbreForm.reset();
    },
  });

  const onSubmitMisurazione = (data: MisurazioneFormValues) => {
    createMisurazioneMutation.mutate(data);
  };

  const onSubmitFebbre = (data: FebbreFormValues) => {
    if (!selectedStatoId) {
      toast({
        title: "Errore",
        description: "Seleziona uno stato di salute",
        variant: "destructive",
      });
      return;
    }
    createFebbreMutation.mutate({ statoId: selectedStatoId, data });
  };

  // Prepara dati per grafici
  const datiFebbre = storicoFebbre?.map((f) => ({
    data: format(new Date(f.dataOraMisurazione), "dd/MM", { locale: it }),
    temperatura: Number(f.temperatura),
    metodo: f.metodoMisurazione,
  })) || [];

  const datiPeso = (Array.isArray(misurazioni) ? misurazioni : [])?.filter((m) => m.tipo === "peso").map((m) => ({
    data: format(new Date(m.dataMisurazione), "dd/MM", { locale: it }),
    peso: Number(m.valore),
  })) || [];

  if (isLoadingMisurazioni || isLoadingFebbre) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Misurazioni</h2>
          <p className="text-sm text-gray-600">Traccia peso, altezza, febbre e altre misurazioni</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isFebbreOpen} onOpenChange={setIsFebbreOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => febbreForm.reset()}>
                <Thermometer className="h-4 w-4 mr-2" />
                Misura Febbre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registra Misurazione Febbre</DialogTitle>
                <DialogDescription>
                  Registra una nuova misurazione della temperatura corporea
                </DialogDescription>
              </DialogHeader>
              <Form {...febbreForm}>
                <form onSubmit={febbreForm.handleSubmit(onSubmitFebbre)} className="space-y-4">
                  <FormField
                    control={febbreForm.control}
                    name="temperatura"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperatura (°C)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="35"
                            max="42"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={febbreForm.control}
                    name="dataOra"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data e Ora</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={febbreForm.control}
                    name="metodoMisurazione"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Metodo Misurazione</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ascellare">Ascellare</SelectItem>
                            <SelectItem value="orale">Orale</SelectItem>
                            <SelectItem value="retale">Retale</SelectItem>
                            <SelectItem value="timpano">Timpano</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {statiSalute && statiSalute.length > 0 && (
                    <FormItem>
                      <FormLabel>Collega a Stato Salute (opzionale)</FormLabel>
                      <Select
                        value={selectedStatoId?.toString() || ""}
                        onValueChange={(value) => setSelectedStatoId(parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona stato salute" />
                        </SelectTrigger>
                        <SelectContent>
                          {statiSalute.map((stato) => (
                            <SelectItem key={stato.id} value={stato.id.toString()}>
                              {stato.tipo} - {format(new Date(stato.dataInizio), "dd/MM/yyyy", { locale: it })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsFebbreOpen(false);
                        setSelectedStatoId(null);
                        febbreForm.reset();
                      }}
                    >
                      Annulla
                    </Button>
                    <Button type="submit" disabled={createFebbreMutation.isPending}>
                      Registra
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isMisurazioneOpen} onOpenChange={setIsMisurazioneOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => misurazioneForm.reset()}>
                <Plus className="h-4 w-4 mr-2" />
                Nuova Misurazione
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registra Misurazione</DialogTitle>
                <DialogDescription>
                  Registra peso, altezza o altre misurazioni antropometriche
                </DialogDescription>
              </DialogHeader>
              <Form {...misurazioneForm}>
                <form onSubmit={misurazioneForm.handleSubmit(onSubmitMisurazione)} className="space-y-4">
                  <FormField
                    control={misurazioneForm.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="peso">Peso</SelectItem>
                            <SelectItem value="altezza">Altezza</SelectItem>
                            <SelectItem value="circonferenza_vita">Circonferenza Vita</SelectItem>
                            <SelectItem value="circonferenza_petto">Circonferenza Petto</SelectItem>
                            <SelectItem value="circonferenza_fianchi">Circonferenza Fianchi</SelectItem>
                            <SelectItem value="bmi">BMI</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={misurazioneForm.control}
                      name="valore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valore</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={misurazioneForm.control}
                      name="unitaMisura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unità</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="cm">cm</SelectItem>
                              <SelectItem value="m">m</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={misurazioneForm.control}
                    name="dataMisurazione"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Misurazione</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsMisurazioneOpen(false);
                        misurazioneForm.reset();
                      }}
                    >
                      Annulla
                    </Button>
                    <Button type="submit" disabled={createMisurazioneMutation.isPending}>
                      Registra
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grafico Febbre */}
      {datiFebbre.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Storico Febbre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datiFebbre}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis domain={[35, 42]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperatura" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Grafico Peso */}
      {datiPeso.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Andamento Peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={datiPeso}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista Misurazioni Recenti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Misurazioni Recenti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {misurazioni && misurazioni.length > 0 ? (
              misurazioni.slice(0, 10).map((misurazione) => (
                <div key={misurazione.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{misurazione.tipo.replace("_", " ")}</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(misurazione.dataMisurazione), "dd MMMM yyyy", { locale: it })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      {misurazione.valore} {misurazione.unitaMisura}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-600 py-8">Nessuna misurazione registrata</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


