"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileDown, FileText, Download, Calendar } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const reportSchema = z.object({
  formato: z.enum(["json", "summary", "pdf"]),
  dataInizio: z.string().optional(),
  dataFine: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export function ReportExport() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      formato: "summary",
      dataInizio: undefined,
      dataFine: undefined,
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: ReportFormValues) => {
      setIsGenerating(true);
      try {
        const result = await cartellaClinicaApi.generaReportCompleto({
          formato: data.formato,
          dataInizio: data.dataInizio,
          dataFine: data.dataFine,
        });

        if (data.formato === "pdf" && result instanceof Blob) {
          const url = window.URL.createObjectURL(result);
          const a = document.createElement("a");
          a.href = url;
          a.download = `report-cartella-clinica-${format(new Date(), "yyyy-MM-dd", { locale: it })}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast({
            title: "Report generato",
            description: "Il report PDF è stato scaricato con successo",
          });
        } else {
          // JSON o summary - mostra in un dialog o scarica come JSON
          const jsonStr = JSON.stringify(result, null, 2);
          const blob = new Blob([jsonStr], { type: "application/json" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `report-cartella-clinica-${format(new Date(), "yyyy-MM-dd", { locale: it })}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast({
            title: "Report generato",
            description: "Il report è stato scaricato con successo",
          });
        }
      } finally {
        setIsGenerating(false);
      }
    },
    onError: (error: any) => {
      setIsGenerating(false);
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante la generazione del report",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (formato: "json" | "csv") => {
      const blob = await cartellaClinicaApi.exportDati(formato);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export-cartella-clinica-${format(new Date(), "yyyy-MM-dd", { locale: it })}.${formato}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export completato",
        description: `I dati sono stati esportati in formato ${formato.toUpperCase()}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'export",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReportFormValues) => {
    generateReportMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Report e Export</h2>
        <p className="text-sm text-gray-600">
          Genera report completi o esporta i tuoi dati in vari formati
        </p>
      </div>

      {/* Generazione Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Genera Report Completo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="formato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato Report</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="summary">Riepilogo (JSON)</SelectItem>
                        <SelectItem value="json">Completo (JSON)</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataInizio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Inizio (opzionale)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>

              <Button
                type="submit"
                disabled={isGenerating || generateReportMutation.isPending}
                className="w-full"
              >
                {isGenerating ? (
                  "Generazione in corso..."
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Genera Report
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Export Dati */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Dati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Esporta tutti i dati della tua cartella clinica in formato JSON o CSV per backup o analisi esterne
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              onClick={() => exportMutation.mutate("json")}
              disabled={exportMutation.isPending}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => exportMutation.mutate("csv")}
              disabled={exportMutation.isPending}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informazioni */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Report PDF:</strong> Include un riepilogo completo della tua cartella clinica in formato PDF
          </p>
          <p>
            <strong>Report JSON:</strong> Include tutti i dati in formato strutturato JSON
          </p>
          <p>
            <strong>Export JSON/CSV:</strong> Esporta tutti i dati per backup o analisi esterne
          </p>
          <p className="text-xs text-gray-500 mt-4">
            I report includono: diario salute, stati salute, misurazioni, documenti e permessi
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


