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
import { Plus, Search, Edit, Trash2, Calendar, Tag, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DiarioSalute, CreateDiarioEntryDto } from "@/types/cartella-clinica";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const diarioSchema = z.object({
  titolo: z.string().min(1, "Titolo richiesto"),
  contenuto: z.string().min(1, "Contenuto richiesto"),
  categoria: z.enum(["sintomo", "evento", "nota", "altro"]),
  tag: z.array(z.string()).optional(),
  dataEvento: z.string().min(1, "Data evento richiesta"),
  note: z.string().optional(),
});

type DiarioFormValues = z.infer<typeof diarioSchema>;

export function DiarioSalute() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiarioSalute | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("tutte");
  const [filtroTag, setFiltroTag] = useState<string>("");

  const form = useForm<DiarioFormValues>({
    resolver: zodResolver(diarioSchema),
    defaultValues: {
      titolo: "",
      contenuto: "",
      categoria: "nota",
      tag: [],
      dataEvento: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const { data: entries, isLoading } = useQuery<DiarioSalute[]>({
    queryKey: ["cartella-clinica-diario", filtroCategoria, filtroTag],
    queryFn: () =>
      cartellaClinicaApi.getDiarioEntries({
        categoria: filtroCategoria !== "tutte" ? filtroCategoria : undefined,
        tag: filtroTag || undefined,
        limit: 100,
      }),
  });

  const { data: searchResults } = useQuery<DiarioSalute[]>({
    queryKey: ["cartella-clinica-diario-search", searchQuery],
    queryFn: () => cartellaClinicaApi.searchDiario(searchQuery),
    enabled: searchQuery.length > 2,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateDiarioEntryDto) => cartellaClinicaApi.createDiarioEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartella-clinica-diario"] });
      toast({
        title: "Voce creata",
        description: "La voce diario è stata creata con successo",
      });
      setIsCreateOpen(false);
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
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateDiarioEntryDto> }) =>
      cartellaClinicaApi.updateDiarioEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartella-clinica-diario"] });
      toast({
        title: "Voce aggiornata",
        description: "La voce diario è stata aggiornata con successo",
      });
      setEditingEntry(null);
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
    mutationFn: (id: number) => cartellaClinicaApi.deleteDiarioEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartella-clinica-diario"] });
      toast({
        title: "Voce eliminata",
        description: "La voce diario è stata eliminata con successo",
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

  const onSubmit = (data: DiarioFormValues) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (entry: DiarioSalute) => {
    setEditingEntry(entry);
    form.reset({
      titolo: entry.titolo,
      contenuto: entry.contenuto,
      categoria: entry.categoria,
      tag: entry.tag || [],
      dataEvento: entry.dataEvento.split("T")[0],
      note: entry.note || "",
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questa voce?")) {
      deleteMutation.mutate(id);
    }
  };

  const displayedEntries = searchQuery.length > 2 ? searchResults : entries;
  const filteredEntries = displayedEntries?.filter((entry) => {
    if (filtroCategoria !== "tutte" && entry.categoria !== filtroCategoria) {
      return false;
    }
    if (filtroTag && (!entry.tag || !entry.tag.includes(filtroTag))) {
      return false;
    }
    return true;
  }) || [];

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      {/* Header con azioni */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Diario Salute</h2>
          <p className="text-sm text-gray-600">Registra sintomi, eventi e note sulla tua salute</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEntry(null);
              form.reset({
                titolo: "",
                contenuto: "",
                categoria: "nota",
                tag: [],
                dataEvento: new Date().toISOString().split("T")[0],
                note: "",
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova Voce
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Modifica Voce" : "Nuova Voce Diario"}</DialogTitle>
              <DialogDescription>
                Registra un nuovo evento, sintomo o nota nella tua cartella clinica
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="titolo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titolo</FormLabel>
                      <FormControl>
                        <Input placeholder="Es. Mal di testa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contenuto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenuto</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrivi l'evento o il sintomo..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleziona categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sintomo">Sintomo</SelectItem>
                            <SelectItem value="evento">Evento</SelectItem>
                            <SelectItem value="nota">Nota</SelectItem>
                            <SelectItem value="altro">Altro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataEvento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Evento</FormLabel>
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
                      setEditingEntry(null);
                      form.reset();
                    }}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingEntry ? "Salva Modifiche" : "Crea Voce"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtri e ricerca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri e Ricerca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cerca nel diario..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Filtra per categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tutte">Tutte le categorie</SelectItem>
                <SelectItem value="sintomo">Sintomo</SelectItem>
                <SelectItem value="evento">Evento</SelectItem>
                <SelectItem value="nota">Nota</SelectItem>
                <SelectItem value="altro">Altro</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filtra per tag..."
              value={filtroTag}
              onChange={(e) => setFiltroTag(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista voci */}
      <div className="space-y-4">
        {filteredEntries && filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{entry.titolo}</CardTitle>
                      <Badge variant="outline">{entry.categoria}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(entry.dataEvento), "dd MMMM yyyy", { locale: it })}
                      </div>
                      {entry.tag && entry.tag.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          <div className="flex gap-1">
                            {entry.tag.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{entry.contenuto}</p>
                {entry.note && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Note:</span> {entry.note}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">Nessuna voce diario trovata</p>
              <p className="text-sm text-gray-500 mt-2">
                Crea la tua prima voce per iniziare a tracciare la tua salute
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


