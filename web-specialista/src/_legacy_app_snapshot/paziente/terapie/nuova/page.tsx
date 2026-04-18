"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  FormDescription,
} from "@/components/ui/form";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Pill, X, Plus, FileText } from "lucide-react";
import Link from "next/link";
import { DrugSearch } from "@/components/paziente/DrugSearch";
import { ImageUpload } from "@/components/paziente/ImageUpload";
import type { ApiResponse } from "@/types/api";

interface Farmaco {
  id: number;
  codiceAic: string;
  nomeCommerciale: string;
  principioAttivo: string;
  formaFarmaceutica?: string;
  dosaggio?: string;
  confezione?: string;
  quantitaConfezione?: number;
  unitaMisura?: string;
  classe?: string;
  ricettaRichiesta: boolean;
  mutuabile: boolean;
  fascia?: string;
  prezzo?: number;
  ticket?: number;
  displayName: string;
}

const terapiaSchema = z.object({
  farmacoId: z.number().min(1, "Seleziona un farmaco"),
  posologia: z.string().min(1, "Posologia richiesta"),
  doseGiornaliera: z.number().min(0.1, "Dose giornaliera richiesta"),
  numeroScatole: z.number().min(1, "Numero scatole richiesto").optional(),
  compressePerScatola: z.number().min(1, "Compresse per scatola richieste").optional(),
  orariAssunzione: z.array(z.string()).min(1, "Aggiungi almeno un orario"),
  conPasto: z.boolean().default(false),
  note: z.string().optional(),
  fotoTalloncinoUrl: z.string().optional(),
});

type TerapiaFormValues = z.infer<typeof terapiaSchema>;

export default function NuovaTerapiaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFarmaco, setSelectedFarmaco] = useState<Farmaco | null>(null);
  const [orari, setOrari] = useState<string[]>([""]);

  const form = useForm<TerapiaFormValues>({
    resolver: zodResolver(terapiaSchema),
    defaultValues: {
      farmacoId: 0,
      posologia: "",
      doseGiornaliera: 1,
      numeroScatole: undefined,
      compressePerScatola: undefined,
      orariAssunzione: [""],
      conPasto: false,
      note: "",
      fotoTalloncinoUrl: undefined,
    },
  });

  // Carica profilo paziente per ottenere medicoCuranteId
  const { data: pazienteProfile } = useQuery({
    queryKey: ["paziente-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>("/paziente/profile");
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TerapiaFormValues) => {
      // Se il farmaco richiede prescrizione, crea una richiesta di prescrizione invece di una terapia diretta
      if (selectedFarmaco?.ricettaRichiesta) {
        if (!pazienteProfile?.medicoCuranteId) {
          throw new Error("Nessun medico curante associato. Contatta il supporto per associare un medico.");
        }

        // Crea richiesta di prescrizione
        const richiestaData = {
          medicoId: pazienteProfile.medicoCuranteId,
          farmaciRichiesti: [{
            nomeFarmaco: selectedFarmaco.nomeCommerciale,
            principioAttivo: selectedFarmaco.principioAttivo || "",
            numeroScatole: data.numeroScatole || 1,
            posologia: data.posologia,
            note: data.note || "",
          }],
          motivo: `Richiesta prescrizione per ${selectedFarmaco.nomeCommerciale}`,
          notePaziente: `Orari assunzione: ${orari.filter((o) => o.trim().length > 0).join(", ")}. ${data.conPasto ? "Assunzione con pasto." : ""}`,
        };

        const response = await api.post<ApiResponse<any>>("/paziente/richieste-prescrizione", richiestaData);
        return { tipo: "richiesta-prescrizione", data: response.data.data };
      } else {
        // Farmaco OTC: crea terapia direttamente
        const response = await api.post<ApiResponse<any>>("/paziente/terapie", {
          ...data,
          orariAssunzione: orari.filter((o) => o.trim().length > 0),
        });
        return { tipo: "terapia", data: response.data.data };
      }
    },
    onSuccess: (result) => {
      if (result.tipo === "richiesta-prescrizione") {
        queryClient.invalidateQueries({ queryKey: ["paziente-richieste-prescrizione"] });
        queryClient.invalidateQueries({ queryKey: ["paziente-dashboard-stats"] });
        toast({
          title: "✅ Richiesta di prescrizione inviata!",
          description: `La tua richiesta per ${result.data?.farmaciRichiesti?.[0]?.nomeFarmaco || 'il farmaco'} è stata inviata al tuo medico. Riceverai una notifica quando verrà approvata. Puoi controllare lo stato nella sezione "Richieste Prescrizione" della dashboard.`,
          duration: 6000,
        });
        // Redirect alla dashboard per vedere subito la richiesta inviata
        router.push("/dashboard");
      } else {
        queryClient.invalidateQueries({ queryKey: ["paziente-terapie"] });
        queryClient.invalidateQueries({ queryKey: ["paziente-terapie-reminder"] });
        toast({
          title: "Terapia creata",
          description: "La terapia è stata creata con successo",
        });
        router.push("/paziente/terapie");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.message || error?.message || "Errore durante la creazione",
        variant: "destructive",
      });
    },
  });

  const handleFarmacoSelect = (farmaco: Farmaco) => {
    setSelectedFarmaco(farmaco);
    form.setValue("farmacoId", farmaco.id);
    
    // Pre-compila posologia se disponibile
    if (farmaco.dosaggio && !form.getValues("posologia")) {
      form.setValue("posologia", `${farmaco.dosaggio} ${farmaco.formaFarmaceutica || ""}`.trim());
    }
  };

  const handleAddOrario = () => {
    setOrari([...orari, ""]);
  };

  const handleRemoveOrario = (index: number) => {
    const newOrari = orari.filter((_, i) => i !== index);
    setOrari(newOrari);
    form.setValue("orariAssunzione", newOrari.filter((o) => o.trim().length > 0));
  };

  const handleOrarioChange = (index: number, value: string) => {
    const newOrari = [...orari];
    newOrari[index] = value;
    setOrari(newOrari);
    form.setValue("orariAssunzione", newOrari.filter((o) => o.trim().length > 0));
  };

  const onSubmit = (data: TerapiaFormValues) => {
    if (!selectedFarmaco) {
      toast({
        title: "Errore",
        description: "Seleziona un farmaco",
        variant: "destructive",
      });
      return;
    }

    if (orari.filter((o) => o.trim().length > 0).length === 0) {
      toast({
        title: "Errore",
        description: "Aggiungi almeno un orario di assunzione",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      ...data,
      orariAssunzione: orari.filter((o) => o.trim().length > 0),
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/paziente/terapie">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle terapie
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuova Terapia</h1>
          <p className="text-gray-600 mt-1">
            Aggiungi un nuovo farmaco alla tua terapia
          </p>
          <div className="mt-2">
            <Link href="/paziente/terapie/wizard" className="text-sm text-blue-700 hover:underline">
              Preferisci una guida semplice? Apri il wizard guidato
            </Link>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Selezione Farmaco */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Seleziona Farmaco
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Opzione 1: Ricerca Testuale */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Cerca farmaco nel catalogo
                </p>
                <DrugSearch
                  onSelect={handleFarmacoSelect}
                  placeholder="Digita il nome del farmaco (es. Lodoz, Aspirina...)"
                  inputId="nuova-terapia-farmaco-search"
                  className="w-full"
                />
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">oppure</span>
                </div>
              </div>

              {/* Opzione 2: Carica Foto Talloncino e Seleziona */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Carica foto del talloncino e seleziona il farmaco
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                  <ImageUpload
                    value={undefined}
                    enableOcr={true}
                    onChange={(url) => {
                      if (url) {
                        form.setValue("fotoTalloncinoUrl", url || undefined);
                      }
                    }}
                    onFarmaciFound={(farmaci) => {
                      if (farmaci && farmaci.length > 0) {
                        // Seleziona automaticamente il primo farmaco trovato
                        const primoFarmaco = farmaci[0];
                        handleFarmacoSelect(primoFarmaco);
                        toast({
                          title: "Farmaco trovato!",
                          description: `Trovato: ${primoFarmaco.nomeCommerciale}. ${farmaci.length > 1 ? `Altri ${farmaci.length - 1} risultati disponibili.` : ""}`,
                        });
                      } else {
                        toast({
                          title: "Nessun farmaco trovato",
                          description: "Cerca manualmente il farmaco nel campo di ricerca sopra",
                          variant: "default",
                        });
                      }
                    }}
                    label=""
                    maxSize={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Carica una foto del talloncino: il sistema cercherà automaticamente il farmaco nel database
                  </p>
                </div>
              </div>

              {selectedFarmaco && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-lg">
                          {selectedFarmaco.nomeCommerciale}
                        </p>
                        {selectedFarmaco.ricettaRichiesta ? (
                          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                            <FileText className="h-3 w-3 inline mr-1" />
                            Richiede Ricetta
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                            OTC
                          </span>
                        )}
                      </div>
                      {selectedFarmaco.dosaggio && (
                        <p className="text-sm text-gray-600 mb-1">
                          Dosaggio: {selectedFarmaco.dosaggio}
                        </p>
                      )}
                      {selectedFarmaco.principioAttivo && (
                        <p className="text-sm text-gray-500">
                          {selectedFarmaco.principioAttivo}
                        </p>
                      )}
                      {selectedFarmaco.formaFarmaceutica && (
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedFarmaco.formaFarmaceutica}
                        </p>
                      )}
                      {selectedFarmaco.confezione && (
                        <p className="text-sm text-gray-500 mt-1">
                          {selectedFarmaco.confezione}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFarmaco(null);
                        form.setValue("farmacoId", 0);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dettagli Terapia */}
          {selectedFarmaco && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Dettagli Terapia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="posologia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posologia *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Es. 1 compressa al mattino"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Come e quando assumere il farmaco
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="doseGiornaliera"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dose Giornaliera (compresse/giorno) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Numero di compresse/capsule da assumere al giorno
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="numeroScatole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numero Scatole</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="compressePerScatola"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compresse per Scatola</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="30"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Orari Assunzione */}
                  <div>
                    <FormLabel>Orari Assunzione *</FormLabel>
                    <div className="space-y-2 mt-2">
                      {orari.map((orario, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="time"
                            value={orario}
                            onChange={(e) => handleOrarioChange(index, e.target.value)}
                            className="flex-1"
                          />
                          {orari.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOrario(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddOrario}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Aggiungi Orario
                      </Button>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="conPasto"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Assunzione con Pasto</FormLabel>
                          <FormDescription>
                            Il farmaco deve essere assunto durante i pasti
                          </FormDescription>
                        </div>
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note</FormLabel>
                        <FormControl>
                          <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Note aggiuntive sulla terapia..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Foto Talloncino (opzionale, per documentazione) */}
              <Card>
                <CardHeader>
                  <CardTitle>Foto Talloncino Scatola (Opzionale)</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="fotoTalloncinoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            label="Carica foto del talloncino della scatola per documentazione"
                            maxSize={5}
                          />
                        </FormControl>
                        <FormDescription>
                          Scatta o carica una foto del talloncino della scatola del farmaco per documentazione
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Bottoni */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creazione...
                    </>
                  ) : (
                    "Crea Terapia"
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>
    </div>
  );
}
