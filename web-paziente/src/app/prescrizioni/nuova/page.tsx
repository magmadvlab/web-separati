"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
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
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import type { ApiResponse, Paziente, Terapia } from "@/types/api";
import { useAuthStore } from "@/stores/auth-store";
import { DrugSearch } from "@/components/paziente/DrugSearch";
import { ImageUpload } from "@/components/paziente/ImageUpload";

const prescrizioneSchema = z.object({
  pazienteId: z.number().min(1, "Seleziona un paziente"),
  farmaci: z.array(
    z.object({
      nomeFarmaco: z.string().min(1, "Nome farmaco richiesto"),
      principioAttivo: z.string().optional(),
      quantita: z.number().min(1, "Quantità richiesta"),
      posologia: z.string().optional(),
      note: z.string().optional(),
    })
  ).min(1, "Aggiungi almeno un farmaco"),
  fotoTalloncino: z.string().optional(),
  note: z.string().optional(),
});

type PrescrizioneFormValues = z.infer<typeof prescrizioneSchema>;

export default function NuovaPrescrizionePage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isPaziente = user?.ruolo === "paziente";

  const { data: pazienteProfile, isLoading: profileLoading } = useQuery<Paziente>({
    queryKey: ["paziente-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Paziente>>("/paziente/profile");
      return response.data.data;
    },
    enabled: isPaziente,
  });

  const { data: terapieAttive, isLoading: terapieLoading } = useQuery<Terapia[]>({
    queryKey: ["paziente-terapie"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Terapia[]>>("/paziente/terapie");
      return response.data.data;
    },
    enabled: isPaziente,
  });

  const createMutation = useMutation({
    mutationFn: async (data: PrescrizioneFormValues) => {
      if (!pazienteProfile?.medicoCuranteId) {
        throw new Error("Nessun medico curante associato. Contatta il supporto.");
      }

      const richiestaData = {
        medicoId: pazienteProfile.medicoCuranteId,
        farmaciRichiesti: data.farmaci.map(f => ({
          nomeFarmaco: f.nomeFarmaco,
          principioAttivo: f.principioAttivo || "",
          numeroScatole: f.quantita,
          posologia: f.posologia || "",
          note: f.note || "",
        })),
        motivo: data.note || "",
        fotoTalloncinoPath: data.fotoTalloncino || undefined,
      };

      const response = await api.post<ApiResponse<any>>("/paziente/richieste-prescrizione", richiestaData);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["paziente-richieste-prescrizione"] });
      queryClient.invalidateQueries({ queryKey: ["paziente-dashboard-stats"] });
      toast({
        title: "✅ Richiesta inviata con successo!",
        description: `La tua richiesta di prescrizione è stata inviata al Dr. ${data?.medico?.nome} ${data?.medico?.cognome || ''}. Riceverai una notifica quando verrà approvata. Puoi controllare lo stato nella sezione "Richieste Prescrizione" della dashboard.`,
        duration: 6000,
      });
      router.push("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.message || error?.message || "Errore durante la creazione",
        variant: "destructive",
      });
    },
  });

  const form = useForm<PrescrizioneFormValues>({
    resolver: zodResolver(prescrizioneSchema),
    defaultValues: {
      pazienteId: 0,
      farmaci: [{ 
        nomeFarmaco: "", 
        quantita: 1,
        principioAttivo: "",
        posologia: "",
        note: "",
      }],
      fotoTalloncino: "",
      note: "",
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "farmaci",
  });

  useEffect(() => {
    if (isPaziente && pazienteProfile?.id) {
      form.setValue("pazienteId", pazienteProfile.id);
    }
  }, [isPaziente, pazienteProfile, form]);

  const hasInitializedFarmaci = useRef(false);

  useEffect(() => {
    if (!isPaziente || hasInitializedFarmaci.current) {
      return;
    }

    if (terapieAttive && terapieAttive.length > 0) {
      const farmaciDefault = terapieAttive
        .map((terapia) => {
          const nomeFarmaco =
            terapia.farmaco?.nomeCommerciale ||
            terapia.farmaco?.principioAttivo ||
            terapia.posologia ||
            "Farmaco";

          return {
            nomeFarmaco: nomeFarmaco || "",
            principioAttivo: terapia.farmaco?.principioAttivo || "",
            quantita: 1,
            posologia: terapia.posologia || "",
            note: terapia.note || "",
          };
        })
        .filter((farmaco, index, self) => index === self.findIndex((f) => f.nomeFarmaco === farmaco.nomeFarmaco));

      if (farmaciDefault.length > 0) {
        replace(farmaciDefault);
        hasInitializedFarmaci.current = true;
      }
    }
  }, [isPaziente, terapieAttive, replace]);

  const onSubmit = (data: PrescrizioneFormValues) => {
    createMutation.mutate(data);
  };

  if (profileLoading || terapieLoading) {
    return <Loading />;
  }

  if (!isPaziente) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Creazione Prescrizione Non Disponibile</h1>
          <p className="text-gray-600 mt-2">
            La prescrizione deve essere emessa dal software medico esterno/SSN.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Flusso corretto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              Usa il tuo gestionale medico abituale per emettere la ricetta.
              RicettaZero riceve poi la prescrizione tramite interceptor e aggiorna automaticamente il paziente.
            </p>
            <Button variant="outline" onClick={() => router.push("/medico/prescrizioni")}>
              Torna alle prescrizioni
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuova Richiesta Prescrizione</h1>
        <p className="text-gray-600 mt-2">
          Invia una richiesta al tuo medico curante
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dettagli Richiesta</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="pazienteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paziente</FormLabel>
                    <FormControl>
                      <Input
                        value={
                          pazienteProfile
                            ? `${pazienteProfile.nome} ${pazienteProfile.cognome}`
                            : ""
                        }
                        readOnly
                      />
                    </FormControl>
                    <input type="hidden" {...field} value={field.value ?? 0} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Farmaci</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ 
                      nomeFarmaco: "", 
                      quantita: 1,
                      principioAttivo: "",
                      posologia: "",
                      note: "",
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Farmaco
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Farmaco {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Rimuovi
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`farmaci.${index}.nomeFarmaco`}
                          render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome Farmaco *</FormLabel>
                              <FormControl>
                                  <DrugSearch
                                    onSelect={(farmaco) => {
                                      field.onChange(farmaco.nomeCommerciale || "");
                                      form.setValue(`farmaci.${index}.principioAttivo`, farmaco.principioAttivo || "");
                                    }}
                                    placeholder="Cerca farmaco nel catalogo..."
                                    className="w-full"
                                  />
                              </FormControl>
                              <FormMessage />
                                <div className="mt-2">
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="Oppure inserisci manualmente il nome"
                                    className="text-sm"
                                  />
                                </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`farmaci.${index}.quantita`}
                          render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantità (Scatole) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                    min="1"
                                  {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`farmaci.${index}.posologia`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Posologia</FormLabel>
                              <FormControl>
                                  <Input 
                                    placeholder="Es. 1 compressa al giorno, 2 volte al giorno..." 
                                    {...field} 
                                    value={field.value || ""}
                                  />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`farmaci.${index}.principioAttivo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Principio Attivo</FormLabel>
                              <FormControl>
                                  <Input 
                                    placeholder="Compilato automaticamente se selezioni dal catalogo" 
                                    {...field} 
                                    value={field.value || ""}
                                  />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <FormField
                control={form.control}
                name="fotoTalloncino"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foto Talloncino (opzionale)</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value}
                        onChange={(url) => {
                          field.onChange(url || "");
                        }}
                        enableOcr={true}
                        label="Carica foto del talloncino della terapia attuale"
                      />
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
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Invio..." : "Invia Richiesta"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Annulla
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
