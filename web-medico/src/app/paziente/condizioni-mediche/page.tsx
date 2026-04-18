"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Edit, Trash2, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ApiResponse } from "@/types/api";

const condizioneSchema = z.object({
  nome: z.string().min(1, "Nome condizione richiesto"),
  tipo: z.string().min(1, "Tipo condizione richiesto"),
  dataDiagnosi: z.string().optional(),
  descrizione: z.string().optional(),
  gravita: z.enum(["lieve", "moderata", "grave"], {
    required_error: "Seleziona la gravità",
  }),
  note: z.string().optional(),
});

type CondizioneFormValues = z.infer<typeof condizioneSchema>;

interface CondizioneMedica {
  id: number;
  nome: string;
  tipo: string;
  dataDiagnosi?: string;
  descrizione?: string;
  gravita: "lieve" | "moderata" | "grave";
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CondizioniMedichePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCondizione, setEditingCondizione] = useState<CondizioneMedica | null>(null);

  const { data: condizioni, isLoading } = useQuery<CondizioneMedica[]>({
    queryKey: ["paziente-condizioni-mediche"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<CondizioneMedica[]>>("/paziente/condizioni-mediche");
      return response.data.data;
    },
  });

  const form = useForm<CondizioneFormValues>({
    resolver: zodResolver(condizioneSchema),
    defaultValues: {
      nome: "",
      tipo: "",
      dataDiagnosi: "",
      descrizione: "",
      gravita: "lieve",
      note: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CondizioneFormValues) => {
      const response = await api.post<ApiResponse<CondizioneMedica>>("/paziente/condizioni-mediche", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-condizioni-mediche"] });
      toast({
        title: "Condizione medica creata",
        description: "La condizione è stata aggiunta con successo",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante la creazione",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CondizioneFormValues> }) => {
      const response = await api.put<ApiResponse<CondizioneMedica>>(`/paziente/condizioni-mediche/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-condizioni-mediche"] });
      toast({
        title: "Condizione medica aggiornata",
        description: "Le modifiche sono state salvate con successo",
      });
      setIsDialogOpen(false);
      setEditingCondizione(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'aggiornamento",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/paziente/condizioni-mediche/${id}/delete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-condizioni-mediche"] });
      toast({
        title: "Condizione medica eliminata",
        description: "La condizione è stata rimossa con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'eliminazione",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (condizione: CondizioneMedica) => {
    setEditingCondizione(condizione);
    form.reset({
      nome: condizione.nome,
      tipo: condizione.tipo,
      dataDiagnosi: condizione.dataDiagnosi ? condizione.dataDiagnosi.split('T')[0] : "",
      descrizione: condizione.descrizione || "",
      gravita: condizione.gravita,
      note: condizione.note || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questa condizione medica?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: CondizioneFormValues) => {
    if (editingCondizione) {
      updateMutation.mutate({ id: editingCondizione.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getGravitaColor = (gravita: string) => {
    switch (gravita) {
      case "grave":
        return "bg-red-100 text-red-800 border-red-300";
      case "moderata":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "lieve":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getGravitaIcon = (gravita: string) => {
    switch (gravita) {
      case "grave":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "moderata":
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case "lieve":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Le Mie Condizioni Mediche</h1>
            <p className="text-gray-600 mt-2">
              Gestisci le tue condizioni mediche e patologie croniche
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCondizione(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Condizione
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCondizione ? "Modifica Condizione Medica" : "Nuova Condizione Medica"}
              </DialogTitle>
              <DialogDescription>
                Aggiungi o modifica una condizione medica o patologia cronica
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Condizione *</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Diabete, Ipertensione, Asma..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Patologia cronica, Allergia, Condizione temporanea..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Specifica il tipo di condizione medica
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataDiagnosi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Diagnosi</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gravita"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gravità *</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                        >
                          <option value="lieve">Lieve</option>
                          <option value="moderata">Moderata</option>
                          <option value="grave">Grave</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descrizione"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrizione</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Descrivi la condizione medica..."
                          {...field}
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
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Note aggiuntive..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingCondizione(null);
                      form.reset();
                    }}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCondizione ? "Salva Modifiche" : "Aggiungi Condizione"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {condizioni && condizioni.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {condizioni.map((condizione) => (
            <Card key={condizione.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{condizione.nome}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">{condizione.tipo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded border ${getGravitaColor(condizione.gravita)}`}>
                      {getGravitaIcon(condizione.gravita)}
                      <span className="ml-1 capitalize">{condizione.gravita}</span>
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {condizione.dataDiagnosi && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span>Diagnosi: {new Date(condizione.dataDiagnosi).toLocaleDateString("it-IT")}</span>
                  </div>
                )}
                {condizione.descrizione && (
                  <p className="text-sm text-gray-700 mb-2">{condizione.descrizione}</p>
                )}
                {condizione.note && (
                  <p className="text-xs text-gray-500 italic mb-3">{condizione.note}</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(condizione)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(condizione.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">
              Nessuna condizione medica registrata
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Aggiungi le tue condizioni mediche per aiutare i medici a prescriverti i farmaci più adatti
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Prima Condizione
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

