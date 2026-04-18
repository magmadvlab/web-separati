"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
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
import type { ApiResponse, Paziente } from "@/types/api";

const profileSchema = z.object({
  telefono: z.string().optional(),
  indirizzo: z.string().min(1, "Indirizzo richiesto"),
  citta: z.string().min(1, "Città richiesta"),
  cap: z.string().min(1, "CAP richiesto"),
  provincia: z.string().min(2, "Provincia richiesta").max(2),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfiloPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<Paziente>({
    queryKey: ["paziente-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Paziente>>("/paziente/profile");
      return response.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Paziente>) => {
      const response = await api.put<ApiResponse<Paziente>>("/paziente/profile", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-profile"] });
      toast({
        title: "Profilo aggiornato",
        description: "Le modifiche sono state salvate con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      telefono: "",
      indirizzo: "",
      citta: "",
      cap: "",
      provincia: "",
    },
  });

  // Update form when profile loads - SPOSTATO IN useEffect PER EVITARE LOOP INFINITO
  useEffect(() => {
    if (profile && !form.formState.isDirty) {
      form.reset({
        telefono: profile.telefono || "",
        indirizzo: profile.indirizzo,
        citta: profile.citta,
        cap: profile.cap,
        provincia: profile.provincia,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const onSubmit = (data: ProfileFormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profilo</h1>
        <p className="text-gray-600 mt-2">
          Gestisci le tue informazioni personali
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informazioni Personali</CardTitle>
        </CardHeader>
        <CardContent>
          {profile && (
            <div className="mb-6 space-y-2">
              <p className="text-sm">
                <span className="font-medium">Nome:</span> {profile.nome} {profile.cognome}
              </p>
              <p className="text-sm">
                <span className="font-medium">Codice Fiscale:</span> {profile.codiceFiscale}
              </p>
              <p className="text-sm">
                <span className="font-medium">Data di Nascita:</span>{" "}
                {new Date(profile.dataNascita).toLocaleDateString("it-IT")}
              </p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="indirizzo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indirizzo</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="citta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Città</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CAP</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="provincia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provincia</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

