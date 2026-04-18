"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { ArrowLeft, Upload, FileText, Plus, Trash2, Save } from "lucide-react";
import Link from "next/link";

interface Prenotazione {
  id: number;
  codicePrenotazione: string;
  paziente: {
    nome: string;
    cognome: string;
  };
  servizio: {
    nome: string;
  };
  consegnaDomicilio: boolean;
}

interface ParametroRisultato {
  nome: string;
  valore: string | number;
  unitaMisura?: string;
  rangeRiferimento?: string;
  flag?: "N" | "H" | "L";
}

export default function InserisciRisultatiPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prenotazioneId = parseInt(params.id as string);
  const [parametri, setParametri] = useState<ParametroRisultato[]>([]);
  const [nuovoParametro, setNuovoParametro] = useState({
    nome: "",
    valore: "",
    unitaMisura: "",
    rangeRiferimento: "",
    flag: "N" as "N" | "H" | "L",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [refertoMedico, setRefertoMedico] = useState("");

  const { data: prenotazione, isLoading } = useQuery<Prenotazione>({
    queryKey: ["prenotazione-laboratorio", prenotazioneId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Prenotazione>>(
        `/laboratori/dashboard/prenotazioni/${prenotazioneId}`
      );
      return response.data.data;
    },
    enabled: !!prenotazioneId,
  });

  const inviaRisultatiMutation = useMutation({
    mutationFn: async (data: {
      parametri?: ParametroRisultato[];
      pdfBase64?: string;
      note?: string;
      refertoMedico?: string;
    }) => {
      const response = await api.post<ApiResponse<any>>(
        `/laboratori/dashboard/prenotazioni/${prenotazioneId}/risultati`,
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prenotazione-laboratorio", prenotazioneId] });
      toast({
        title: "Risultati inviati",
        description: "I risultati sono stati inviati con successo",
      });
      router.push(`/laboratorio/prenotazioni/${prenotazioneId}`);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante l'invio risultati",
        variant: "destructive",
      });
    },
  });

  const handleAddParametro = () => {
    if (!nuovoParametro.nome || !nuovoParametro.valore) {
      toast({
        title: "Errore",
        description: "Inserisci nome e valore del parametro",
        variant: "destructive",
      });
      return;
    }
    setParametri([...parametri, { ...nuovoParametro }]);
    setNuovoParametro({
      nome: "",
      valore: "",
      unitaMisura: "",
      rangeRiferimento: "",
      flag: "N",
    });
  };

  const handleRemoveParametro = (index: number) => {
    setParametri(parametri.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      toast({
        title: "Errore",
        description: "Seleziona un file PDF",
        variant: "destructive",
      });
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parametri.length === 0 && !pdfFile && !refertoMedico) {
      toast({
        title: "Errore",
        description: "Inserisci almeno parametri, PDF o referto medico",
        variant: "destructive",
      });
      return;
    }

    let pdfBase64: string | undefined;
    if (pdfFile) {
      try {
        pdfBase64 = await convertFileToBase64(pdfFile);
        // Rimuovi il prefisso data:application/pdf;base64,
        pdfBase64 = pdfBase64.split(",")[1];
      } catch (error) {
        toast({
          title: "Errore",
          description: "Errore durante la conversione del PDF",
          variant: "destructive",
        });
        return;
      }
    }

    inviaRisultatiMutation.mutate({
      parametri: parametri.length > 0 ? parametri : undefined,
      pdfBase64,
      note: note || undefined,
      refertoMedico: refertoMedico || undefined,
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!prenotazione) {
    return <NotFound message="Prenotazione non trovata" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/laboratorio/prenotazioni/${prenotazioneId}`}
          className="flex items-center text-sm text-gray-500 hover:underline"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Torna al dettaglio
        </Link>
        <h1 className="text-2xl font-bold">Inserisci Risultati</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prenotazione</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Paziente:</span> {prenotazione.paziente.nome}{" "}
              {prenotazione.paziente.cognome}
            </p>
            <p>
              <span className="font-medium">Servizio:</span> {prenotazione.servizio.nome}
            </p>
            <p>
              <span className="font-medium">Codice:</span> {prenotazione.codicePrenotazione}
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Parametri Risultato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="nomeParametro">Nome Parametro *</Label>
                <Input
                  id="nomeParametro"
                  value={nuovoParametro.nome}
                  onChange={(e) => setNuovoParametro({ ...nuovoParametro, nome: e.target.value })}
                  placeholder="Es. Glicemia"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valoreParametro">Valore *</Label>
                <Input
                  id="valoreParametro"
                  value={nuovoParametro.valore}
                  onChange={(e) => setNuovoParametro({ ...nuovoParametro, valore: e.target.value })}
                  placeholder="Es. 95"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitaMisura">Unità di Misura</Label>
                <Input
                  id="unitaMisura"
                  value={nuovoParametro.unitaMisura}
                  onChange={(e) => setNuovoParametro({ ...nuovoParametro, unitaMisura: e.target.value })}
                  placeholder="Es. mg/dL"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rangeRiferimento">Range di Riferimento</Label>
                <Input
                  id="rangeRiferimento"
                  value={nuovoParametro.rangeRiferimento}
                  onChange={(e) => setNuovoParametro({ ...nuovoParametro, rangeRiferimento: e.target.value })}
                  placeholder="Es. 70-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flag">Flag</Label>
                <Select
                  value={nuovoParametro.flag}
                  onValueChange={(value: "N" | "H" | "L") =>
                    setNuovoParametro({ ...nuovoParametro, flag: value })
                  }
                >
                  <SelectTrigger id="flag">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N">Normale</SelectItem>
                    <SelectItem value="H">Alto</SelectItem>
                    <SelectItem value="L">Basso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={handleAddParametro} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi
                </Button>
              </div>
            </div>

            {parametri.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label>Parametri Aggiunti</Label>
                <div className="space-y-2">
                  {parametri.map((parametro, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{parametro.nome}</p>
                        <p className="text-sm text-gray-600">
                          {parametro.valore} {parametro.unitaMisura && parametro.unitaMisura}
                          {parametro.rangeRiferimento && ` (${parametro.rangeRiferimento})`}
                          {parametro.flag && ` [${parametro.flag === "N" ? "Normale" : parametro.flag === "H" ? "Alto" : "Basso"}]`}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParametro(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Upload PDF Risultati
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdfFile">File PDF</Label>
              <Input
                id="pdfFile"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              {pdfFile && (
                <p className="text-sm text-gray-600">File selezionato: {pdfFile.name}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Referto Medico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="refertoMedico">Referto</Label>
              <Textarea
                id="refertoMedico"
                placeholder="Inserisci il referto medico"
                value={refertoMedico}
                onChange={(e) => setRefertoMedico(e.target.value)}
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Note</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="note">Note per il paziente</Label>
              <Textarea
                id="note"
                placeholder="Note aggiuntive"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Link href={`/laboratorio/prenotazioni/${prenotazioneId}`}>
            <Button type="button" variant="outline">
              Annulla
            </Button>
          </Link>
          <Button type="submit" disabled={inviaRisultatiMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {inviaRisultatiMutation.isPending ? "Invio..." : "Invia Risultati"}
          </Button>
        </div>
      </form>
    </div>
  );
}


