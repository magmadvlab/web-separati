"use client";

import { useState, useRef } from "react";
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
import { Plus, FileText, Upload, Download, Trash2, Eye, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DocumentoCartellaClinica, CreateDocumentoDto } from "@/types/cartella-clinica";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const documentoSchema = z.object({
  titolo: z.string().min(1, "Titolo richiesto"),
  descrizione: z.string().optional(),
  tipo: z.enum(["nota", "sintomo", "evento", "misurazione", "documento_esterno"]),
  contenutoTesto: z.string().optional(),
  tag: z.array(z.string()).optional(),
  categoria: z.string().optional(),
  visibilitaMedico: z.boolean().optional(),
  dataEvento: z.string().min(1, "Data evento richiesta"),
  note: z.string().optional(),
});

type DocumentoFormValues = z.infer<typeof documentoSchema>;

export function Documenti() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("tutti");

  const form = useForm<DocumentoFormValues>({
    resolver: zodResolver(documentoSchema),
    defaultValues: {
      titolo: "",
      descrizione: "",
      tipo: "nota",
      contenutoTesto: "",
      tag: [],
      categoria: "",
      visibilitaMedico: false,
      dataEvento: new Date().toISOString().split("T")[0],
      note: "",
    },
  });

  const { data: documenti, isLoading } = useQuery<DocumentoCartellaClinica[]>({
    queryKey: ["cartella-clinica-documenti", filtroTipo],
    queryFn: () =>
      cartellaClinicaApi.getDocumenti({
        tipo: filtroTipo !== "tutti" ? filtroTipo : undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: { dto: CreateDocumentoDto; file?: File }) =>
      cartellaClinicaApi.createDocumento(data.dto, data.file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartella-clinica-documenti"] });
      toast({
        title: "Documento creato",
        description: "Il documento è stato creato con successo",
      });
      setIsCreateOpen(false);
      setSelectedFile(null);
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => cartellaClinicaApi.deleteDocumento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cartella-clinica-documenti"] });
      toast({
        title: "Documento eliminato",
        description: "Il documento è stato eliminato con successo",
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

  const onSubmit = (data: DocumentoFormValues) => {
    createMutation.mutate({ dto: data, file: selectedFile || undefined });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDownload = (documento: DocumentoCartellaClinica) => {
    if (documento.fileAllegatoUrl) {
      window.open(documento.fileAllegatoUrl, "_blank");
    } else {
      toast({
        title: "Errore",
        description: "URL del file non disponibile",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questo documento?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredDocumenti = documenti || [];

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documenti</h2>
          <p className="text-sm text-gray-600">Carica e gestisci i tuoi documenti clinici</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              form.reset();
              setSelectedFile(null);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuovo Documento</DialogTitle>
              <DialogDescription>
                Carica un nuovo documento o crea una nota nella tua cartella clinica
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
                        <Input placeholder="Titolo del documento" {...field} />
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
                      <FormLabel>Descrizione (opzionale)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrizione del documento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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
                            <SelectItem value="nota">Nota</SelectItem>
                            <SelectItem value="sintomo">Sintomo</SelectItem>
                            <SelectItem value="evento">Evento</SelectItem>
                            <SelectItem value="misurazione">Misurazione</SelectItem>
                            <SelectItem value="documento_esterno">Documento Esterno</SelectItem>
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
                  name="contenutoTesto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenuto (opzionale)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Contenuto del documento..." className="min-h-[100px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>File Allegato (opzionale)</FormLabel>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="text-center">
                      {selectedFile ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                          >
                            Rimuovi
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-gray-400" />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Seleziona File
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setSelectedFile(null);
                      form.reset();
                    }}
                  >
                    Annulla
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Carica Documento
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue placeholder="Filtra per tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutti i tipi</SelectItem>
              <SelectItem value="nota">Nota</SelectItem>
              <SelectItem value="sintomo">Sintomo</SelectItem>
              <SelectItem value="evento">Evento</SelectItem>
              <SelectItem value="misurazione">Misurazione</SelectItem>
              <SelectItem value="documento_esterno">Documento Esterno</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Lista Documenti */}
      <div className="space-y-4">
        {filteredDocumenti.length > 0 ? (
          filteredDocumenti.map((documento) => (
            <Card key={documento.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{documento.titolo}</CardTitle>
                      <Badge variant="outline">{documento.tipo}</Badge>
                      {documento.visibilitaMedico && (
                        <Badge variant="secondary">Visibile al medico</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {format(new Date(documento.dataEvento), "dd MMMM yyyy", { locale: it })}
                    </p>
                    {documento.descrizione && (
                      <p className="text-sm text-gray-700 mt-2">{documento.descrizione}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {documento.fileAllegatoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(documento)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(documento.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {documento.contenutoTesto && (
                  <p className="text-gray-700 whitespace-pre-wrap">{documento.contenutoTesto}</p>
                )}
                {documento.tag && documento.tag.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {documento.tag.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {documento.fileAllegatoUrl && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>File allegato disponibile</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Nessun documento caricato</p>
              <p className="text-sm text-gray-500 mt-2">
                Carica il tuo primo documento per iniziare
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


