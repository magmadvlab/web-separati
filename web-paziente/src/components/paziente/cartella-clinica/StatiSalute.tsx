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
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Activity, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RegistrazioneStatoSalute, CreateStatoSaluteDto } from "@/types/cartella-clinica";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const statoSaluteSchema = z.object({
  tipo: z.enum(["influenza", "raffreddore", "malessere", "sintomo_generico"]),
  sintomi: z.array(z.string()).min(1, "Almeno un sintomo richiesto"),
  gravita: z.enum(["lieve", "moderata", "grave"]),
  dataInizio: z.string().min(1, "Data inizio richiesta"),
  dataFine: z.string().optional(),
  durataGiorni: z.number().optional(),
  note: z.string().optional(),
});

type StatoSaluteFormValues = z.infer<typeof statoSaluteSchema>;

export function StatiSalute() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sintomoInput, setSintomoInput] = useState("");

  const form = useForm<StatoSaluteFormValues>({
    resolver: zodResolver(statoSaluteSchema),
    defaultValues: {
      tipo: "sintomo_generico",
      sintomi: [],
      gravita: "lieve",
      dataInizio: new Date().toISOString().split("T")[0],
      dataFine: undefined,
      durataGiorni: undefined,
      note: "",
    },
  });

  const { data: stati, isLoading } = useQuery<RegistrazioneStatoSalute[]>({
    queryKey: ["cartella-clinica-stati-salute"],
    queryFn: () => cartellaClinicaApi.getStatiSalute(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStatoSaluteDto) => cartellaClinicaApi.registraStatoSalute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartella-clinica-stati-salute"] });
      toast({
        title: "Stato registrato",
        description: "Lo stato di salute è stato registrato con successo",
      });
      setIsCreateOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante la registrazione",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StatoSaluteFormValues) => {
    createMutation.mutate(data);
  };

  const addSintomo = () => {
    if (sintomoInput.trim()) {
      const currentSintomi = form.getValues("sintomi") || [];
      form.setValue("sintomi", [...currentSintomi, sintomoInput.trim()]);
      setSintomoInput("");
    }
  };

  const removeSintomo = (index: number) => {
    const currentSintomi = form.getValues("sintomi") || [];
    form.setValue("sintomi", currentSintomi.filter((_, i) => i !== index));
  };

  const getGravitaColor = (gravita: string) => {
    switch (gravita) {
      case "grave":
        return "bg-red-100 text-red-800";
      case "moderata":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stati Salute</h2>
          <p className="text-sm text-gray-600">Registra stati di salute, sintomi e malesseri</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => form.reset()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Stato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registra Stato Salute</DialogTitle>
              <DialogDescription>
                Registra un nuovo stato di salute o sintomo
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="influenza">Influenza</SelectItem>
                          <SelectItem value="raffreddore">Raffreddore</SelectItem>
                          <SelectItem value="malessere">Malessere</SelectItem>
                          <SelectItem value="sintomo_generico">Sintomo Generico</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sintomi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sintomi</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Aggiungi sintomo..."
                              value={sintomoInput}
                              onChange={(e) => setSintomoInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addSintomo();
                                }
                              }}
                            />
                            <Button type="button" onClick={addSintomo} variant="outline">
                              Aggiungi
                            </Button>
                          </div>
                          {field.value && field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {field.value.map((sintomo, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                  {sintomo}
                                  <button
                                    type="button"
                                    onClick={() => removeSintomo(index)}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="gravita"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gravità</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona gravità" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lieve">Lieve</SelectItem>
                            <SelectItem value="moderata">Moderata</SelectItem>
                            <SelectItem value="grave">Grave</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataInizio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Inizio</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dataFine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Fine (opzionale)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (opzionale)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Note aggiuntive..." {...field} />
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
                      setIsCreateOpen(false);
                      form.reset();
                    }}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Registra Stato
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {stati && stati.length > 0 ? (
          stati.map((stato) => (
            <Card key={stato.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg capitalize">{stato.tipo.replace("_", " ")}</CardTitle>
                      <Badge className={getGravitaColor(stato.gravita)}>{stato.gravita}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(stato.dataInizio), "dd MMMM yyyy", { locale: it })}
                        {stato.dataFine && (
                          <> - {format(new Date(stato.dataFine), "dd MMMM yyyy", { locale: it })}</>
                        )}
                      </div>
                      {stato.durataGiorni && (
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          {stato.durataGiorni} giorni
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">Sintomi:</p>
                  <div className="flex flex-wrap gap-2">
                    {stato.sintomi.map((sintomo, idx) => (
                      <Badge key={idx} variant="outline">
                        {sintomo}
                      </Badge>
                    ))}
                  </div>
                </div>
                {stato.note && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Note:</span> {stato.note}
                    </p>
                  </div>
                )}
                {stato.misurazioniFebbre && stato.misurazioniFebbre.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Misurazioni Febbre:</p>
                    <div className="space-y-1">
                      {stato.misurazioniFebbre.map((febbre) => (
                        <div key={febbre.id} className="text-sm text-gray-600">
                          {febbre.temperatura}°C - {format(new Date(febbre.dataOraMisurazione), "dd/MM/yyyy HH:mm", { locale: it })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nessuno stato di salute registrato</p>
              <p className="text-sm text-gray-500 mt-2">
                Registra il tuo primo stato di salute per iniziare
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


