"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Camera, Upload, Plus, X, FileText, Pill, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  tipoRichiesta: z.enum(["farmaci", "farmaci_da_banco"], {
    required_error: "Seleziona il tipo di richiesta",
  }),
  farmaci: z.array(z.object({
    nome: z.string().min(1, "Nome farmaco richiesto"),
    quantita: z.number().min(1, "Quantità minima 1"),
    dosaggio: z.string().optional(),
  })).min(1, "Aggiungi almeno un farmaco"),
  motivo: z.string().min(10, "Descrivi il motivo (minimo 10 caratteri)"),
  notePaziente: z.string().optional(),
  fotoTalloncino: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NuovaRichiestaPrescrizione() {
  const router = useRouter();
  const { toast } = useToast();
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipoRichiesta: "farmaci",
      farmaci: [{ nome: "", quantita: 1, dosaggio: "" }],
      motivo: "",
      notePaziente: "",
      fotoTalloncino: "",
    },
  });

  const tipoRichiesta = form.watch("tipoRichiesta");
  const farmaci = form.watch("farmaci");

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Errore",
        description: "Seleziona un'immagine (JPG, PNG, WEBP)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Errore",
        description: "Il file è troppo grande (max 10MB)",
        variant: "destructive",
      });
      return;
    }

    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/paziente/upload/talloncino/ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const photoUrl = response.data.data?.url || response.data.url;
      setUploadedPhotoUrl(photoUrl);
      form.setValue('fotoTalloncino', photoUrl);

      // Se OCR ha rilevato farmaci, suggeriscili
      if (response.data.data?.farmaci && response.data.data.farmaci.length > 0) {
        const farmaciRilevati = response.data.data.farmaci.map((f: any) => ({
          nome: f.nome || f.name,
          quantita: f.quantita || 1,
          dosaggio: f.dosaggio || "",
        }));
        form.setValue('farmaci', farmaciRilevati);
        
        toast({
          title: "Farmaci rilevati!",
          description: `Abbiamo trovato ${farmaciRilevati.length} farmaco/i dalla foto`,
        });
      } else {
        toast({
          title: "Foto caricata",
          description: "La foto è stata caricata con successo",
        });
      }
    } catch (error) {
      console.error("Errore upload:", error);
      toast({
        title: "Errore",
        description: "Errore durante il caricamento della foto",
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const addFarmaco = () => {
    const currentFarmaci = form.getValues("farmaci");
    form.setValue("farmaci", [...currentFarmaci, { nome: "", quantita: 1, dosaggio: "" }]);
  };

  const removeFarmaco = (index: number) => {
    const currentFarmaci = form.getValues("farmaci");
    if (currentFarmaci.length > 1) {
      form.setValue("farmaci", currentFarmaci.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        tipoRichiesta: data.tipoRichiesta,
        farmaciRichiesti: data.farmaci,
        motivo: data.motivo,
        notePaziente: data.notePaziente,
        fotoTalloncinoUrl: data.fotoTalloncino,
      };

      await api.post('/paziente/richieste-prescrizione', payload);

      toast({
        title: "Richiesta inviata!",
        description: tipoRichiesta === "farmaci" 
          ? "Il tuo medico riceverà la richiesta e ti risponderà presto"
          : "La farmacia riceverà la tua richiesta per i farmaci da banco",
      });

      router.push('/paziente/dashboard');
    } catch (error: any) {
      console.error("Errore invio richiesta:", error);
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore durante l'invio della richiesta",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Nuova Richiesta Prescrizione</h1>
        <p className="text-gray-600 mt-2">
          Richiedi farmaci con ricetta o farmaci da banco
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo Richiesta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Tipo di Richiesta
              </CardTitle>
              <CardDescription>
                Scegli se richiedere farmaci con ricetta o farmaci da banco
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="tipoRichiesta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona tipo richiesta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="farmaci">
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Farmaci con Ricetta</div>
                              <div className="text-xs text-gray-500">
                                Richiede approvazione del medico
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="farmaci_da_banco">
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Farmaci da Banco (OTC)</div>
                              <div className="text-xs text-gray-500">
                                Senza ricetta, ordine diretto in farmacia
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {tipoRichiesta === "farmaci" 
                        ? "La richiesta verrà inviata al tuo medico curante per approvazione"
                        : "L'ordine verrà inviato direttamente alla farmacia senza bisogno di ricetta"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tipoRichiesta === "farmaci_da_banco" && (
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    I farmaci da banco (OTC) non richiedono ricetta medica e possono essere acquistati direttamente.
                    L'ordine verrà processato dalla farmacia senza passare dal medico.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Upload Foto Talloncino */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-purple-600" />
                Foto Talloncino (Opzionale)
              </CardTitle>
              <CardDescription>
                Carica una foto del talloncino della scatola per aiutarci a identificare il farmaco
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50'
                } ${uploadingFile ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="talloncino-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploadingFile}
                />
                
                {uploadedPhotoUrl ? (
                  <div className="space-y-4">
                    <div className="relative w-full max-w-md mx-auto">
                      <img
                        src={uploadedPhotoUrl}
                        alt="Talloncino caricato"
                        className="w-full h-48 object-contain rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setUploadedPhotoUrl(null);
                          form.setValue('fotoTalloncino', '');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-green-600 font-medium">
                      ✓ Foto caricata con successo
                    </p>
                    <label htmlFor="talloncino-upload">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Carica un'altra foto
                        </span>
                      </Button>
                    </label>
                  </div>
                ) : (
                  <label htmlFor="talloncino-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-3">
                      {uploadingFile ? (
                        <>
                          <Upload className="h-12 w-12 text-primary animate-pulse" />
                          <p className="text-sm text-gray-600">Caricamento in corso...</p>
                        </>
                      ) : (
                        <>
                          <Camera className="h-12 w-12 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">
                              Scatta o carica una foto del talloncino
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Trascina qui il file oppure clicca per selezionare (max 10MB)
                            </p>
                          </div>
                          <Button type="button" variant="outline" size="sm" disabled={uploadingFile}>
                            <Upload className="h-4 w-4 mr-2" />
                            Carica Foto
                          </Button>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Farmaci Richiesti */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-green-600" />
                    Farmaci Richiesti
                  </CardTitle>
                  <CardDescription>
                    Aggiungi i farmaci che desideri richiedere
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addFarmaco}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Farmaco
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {farmaci.map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Farmaco {index + 1}</Badge>
                    {farmaci.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFarmaco(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name={`farmaci.${index}.nome`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Nome Farmaco *</FormLabel>
                          <FormControl>
                            <Input placeholder="Es: Tachipirina" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`farmaci.${index}.quantita`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantità *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`farmaci.${index}.dosaggio`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosaggio (opzionale)</FormLabel>
                        <FormControl>
                          <Input placeholder="Es: 500mg, 20 compresse" {...field} />
                        </FormControl>
                        <FormDescription>
                          Specifica il dosaggio o la confezione desiderata
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Motivo e Note */}
          <Card>
            <CardHeader>
              <CardTitle>Dettagli Richiesta</CardTitle>
              <CardDescription>
                Fornisci informazioni aggiuntive per la richiesta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo della Richiesta *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          tipoRichiesta === "farmaci"
                            ? "Es: Ho mal di testa frequente, vorrei un antidolorifico"
                            : "Es: Ho bisogno di vitamine per il cambio stagione"
                        }
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {tipoRichiesta === "farmaci"
                        ? "Descrivi i sintomi o il motivo per cui richiedi questi farmaci"
                        : "Descrivi perché hai bisogno di questi prodotti"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notePaziente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note Aggiuntive (opzionale)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Eventuali note o preferenze..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Aggiungi eventuali informazioni aggiuntive
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Azioni */}
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
              className="flex-1"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Invio in corso...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Invia Richiesta
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
