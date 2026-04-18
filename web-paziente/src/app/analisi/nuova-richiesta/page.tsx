"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loading } from "@/components/shared/Loading";
import { ArrowLeft, FileText, Plus, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse, Medico } from "@/types/api";

interface AnalisiRichiesta {
  nome: string;
  tipo: string;
  motivo?: string;
}

export default function NuovaRichiestaAnalisiPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [tipoRichiesta, setTipoRichiesta] = useState<string>("");
  const [analisiRichieste, setAnalisiRichieste] = useState<AnalisiRichiesta[]>([]);
  const [nuovaAnalisi, setNuovaAnalisi] = useState<AnalisiRichiesta>({
    nome: "",
    tipo: "",
    motivo: "",
  });
  const [medicoId, setMedicoId] = useState<number | null>(null);
  const [motivo, setMotivo] = useState<string>("");
  const [notePaziente, setNotePaziente] = useState<string>("");
  const [urgenza, setUrgenza] = useState<string>("normale");

  // Carica medici disponibili (usa il medico curante o tutti i medici)
  const { data: pazienteProfile } = useQuery({
    queryKey: ["paziente-profile"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>("/paziente/profile");
      return response.data.data;
    },
  });

  const { data: medici } = useQuery<Medico[]>({
    queryKey: ["medici-disponibili"],
    queryFn: async () => {
      // Se ha un medico curante, mostra quello, altrimenti cerca tutti i medici
      if (pazienteProfile?.medicoCurante) {
        return [pazienteProfile.medicoCurante];
      }
      // Fallback: cerca medici tramite endpoint admin o altro
      // Per ora usa solo il medico curante se disponibile
      return pazienteProfile?.medicoCurante ? [pazienteProfile.medicoCurante] : [];
    },
    enabled: !!pazienteProfile,
  });

  // Mutation per creare richiesta
  const createRichiestaMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>(
        "/paziente/richieste-analisi",
        data
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Richiesta creata con successo!",
        description: "La tua richiesta è stata inviata al medico. Riceverai una notifica quando verrà approvata.",
      });
      queryClient.invalidateQueries({ queryKey: ["richieste-analisi"] });
      router.push("/analisi/richieste");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description:
          error.response?.data?.error?.message || "Errore durante la creazione della richiesta",
        variant: "destructive",
      });
    },
  });

  const aggiungiAnalisi = () => {
    if (!nuovaAnalisi.nome.trim() || !nuovaAnalisi.tipo.trim()) {
      toast({
        title: "Attenzione",
        description: "Inserisci nome e tipo dell'analisi",
        variant: "destructive",
      });
      return;
    }
    setAnalisiRichieste([...analisiRichieste, { ...nuovaAnalisi }]);
    setNuovaAnalisi({ nome: "", tipo: "", motivo: "" });
  };

  const rimuoviAnalisi = (index: number) => {
    setAnalisiRichieste(analisiRichieste.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!medicoId) {
      toast({
        title: "Attenzione",
        description: "Seleziona un medico",
        variant: "destructive",
      });
      return;
    }

    if (analisiRichieste.length === 0) {
      toast({
        title: "Attenzione",
        description: "Aggiungi almeno un'analisi richiesta",
        variant: "destructive",
      });
      return;
    }

    createRichiestaMutation.mutate({
      medicoId,
      tipoRichiesta,
      analisiRichieste,
      motivo: motivo.trim() || undefined,
      notePaziente: notePaziente.trim() || undefined,
      urgenza,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/analisi/richieste">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alle richieste
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuova Richiesta Analisi</h1>
          <p className="text-gray-600 mt-1">
            Richiedi analisi, radiografie, TAC o risonanze al tuo medico
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form principale */}
        <div className="md:col-span-2 space-y-6">
          {/* Tipo Richiesta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tipo Richiesta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Tipo Esame</Label>
                <Select value={tipoRichiesta} onValueChange={setTipoRichiesta}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleziona tipo esame" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="analisi_sangue">Analisi del Sangue</SelectItem>
                    <SelectItem value="radiografia">Radiografia</SelectItem>
                    <SelectItem value="tac">TAC</SelectItem>
                    <SelectItem value="risonanza">Risonanza Magnetica</SelectItem>
                    <SelectItem value="ecografia">Ecografia</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Analisi Richieste */}
          <Card>
            <CardHeader>
              <CardTitle>Analisi Richieste</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Form per aggiungere analisi */}
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label>Nome Analisi</Label>
                  <Input
                    value={nuovaAnalisi.nome}
                    onChange={(e) =>
                      setNuovaAnalisi({ ...nuovaAnalisi, nome: e.target.value })
                    }
                    placeholder="es. Emocromo completo"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={nuovaAnalisi.tipo}
                    onValueChange={(value) =>
                      setNuovaAnalisi({ ...nuovaAnalisi, tipo: value })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sangue">Sangue</SelectItem>
                      <SelectItem value="urine">Urine</SelectItem>
                      <SelectItem value="radiografia">Radiografia</SelectItem>
                      <SelectItem value="tac">TAC</SelectItem>
                      <SelectItem value="risonanza">Risonanza</SelectItem>
                      <SelectItem value="ecografia">Ecografia</SelectItem>
                      <SelectItem value="altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={aggiungiAnalisi} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi
                  </Button>
                </div>
              </div>

              {/* Lista analisi aggiunte */}
              {analisiRichieste.length > 0 && (
                <div className="space-y-2">
                  <Label>Analisi Selezionate</Label>
                  {analisiRichieste.map((analisi, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{analisi.nome}</p>
                        <p className="text-sm text-gray-600">{analisi.tipo}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => rimuoviAnalisi(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Motivo e Note */}
          <Card>
            <CardHeader>
              <CardTitle>Motivo e Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Motivo della Richiesta</Label>
                <Textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Descrivi il motivo della richiesta..."
                  className="mt-2"
                  rows={3}
                />
              </div>
              <div>
                <Label>Note Aggiuntive (opzionale)</Label>
                <Textarea
                  value={notePaziente}
                  onChange={(e) => setNotePaziente(e.target.value)}
                  placeholder="Note aggiuntive per il medico..."
                  className="mt-2"
                  rows={2}
                />
              </div>
              <div>
                <Label>Urgenza</Label>
                <Select value={urgenza} onValueChange={setUrgenza}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normale">Normale</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                    <SelectItem value="molto_urgente">Molto Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Selezione Medico */}
          <Card>
            <CardHeader>
              <CardTitle>Medico</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label>Seleziona Medico</Label>
                <Select
                  value={medicoId?.toString() || ""}
                  onValueChange={(value) => setMedicoId(parseInt(value))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Seleziona medico" />
                  </SelectTrigger>
                  <SelectContent>
                    {medici?.map((medico) => (
                      <SelectItem key={medico.id} value={medico.id.toString()}>
                        Dr. {medico.nome} {medico.cognome}
                        {medico.specializzazione && ` - ${medico.specializzazione}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={createRichiestaMutation.isPending}
          >
            {createRichiestaMutation.isPending ? "Invio in corso..." : "Invia Richiesta"}
          </Button>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informazioni</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>
                La tua richiesta verrà inviata al medico selezionato per l'approvazione.
              </p>
              <p>
                Riceverai una notifica quando il medico avrà risposto alla tua richiesta.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

