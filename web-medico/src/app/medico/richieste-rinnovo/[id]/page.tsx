"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { NotFound } from "@/components/shared/NotFound";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse, RichiestaRinnovoPrescrizione } from "@/types/api";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Pill,
  FileText,
  AlertCircle,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function MedicoDettaglioRichiestaRinnovoPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const richiestaId = parseInt(params.id as string);

  const [showApprovaDialog, setShowApprovaDialog] = useState(false);
  const [showRifiutaDialog, setShowRifiutaDialog] = useState(false);
  const [motivoRifiuto, setMotivoRifiuto] = useState("");
  const [numeroScatole, setNumeroScatole] = useState<number>(0);
  const [ripetibile, setRipetibile] = useState<boolean>(true);
  const [numeroRipetizioni, setNumeroRipetizioni] = useState<number>(5);

  const { data: richiesta, isLoading, error } = useQuery<RichiestaRinnovoPrescrizione>({
    queryKey: ["medico-richiesta-rinnovo", richiestaId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<RichiestaRinnovoPrescrizione>>(
        `/medico/richieste-rinnovo/${richiestaId}`
      );
      return response.data.data;
    },
    enabled: !!richiestaId,
  });

  // Inizializza i valori quando la richiesta viene caricata
  useEffect(() => {
    if (richiesta) {
      setNumeroScatole(richiesta.quantitaScatole);
      setRipetibile(richiesta.ripetibile);
      setNumeroRipetizioni(richiesta.numeroRipetizioni || 5);
    }
  }, [richiesta]);

  const approvaMutation = useMutation({
    mutationFn: async (data: {
      numeroScatole?: number;
      ripetibile?: boolean;
      numeroRipetizioni?: number;
      note?: string;
    }) => {
      const response = await api.post<ApiResponse<any>>(
        `/medico/richieste-rinnovo/${richiestaId}/approva`,
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: "Richiesta approvata",
        description: "La nuova prescrizione è stata creata con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["medico-richieste-rinnovo"] });
      queryClient.invalidateQueries({ queryKey: ["medico-prescrizioni"] });
      router.push("/medico/richieste-rinnovo");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.error?.message || "Errore durante l'approvazione",
        variant: "destructive",
      });
    },
  });

  const rifiutaMutation = useMutation({
    mutationFn: async (motivo: string) => {
      const response = await api.post<ApiResponse<any>>(
        `/medico/richieste-rinnovo/${richiestaId}/rifiuta`,
        { motivo }
      );
      return response.data.data;
    },
    onSuccess: () => {
      toast({
        title: "Richiesta rifiutata",
        description: "La richiesta è stata rifiutata.",
      });
      queryClient.invalidateQueries({ queryKey: ["medico-richieste-rinnovo"] });
      router.push("/medico/richieste-rinnovo");
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.error?.message || "Errore durante il rifiuto",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error || !richiesta) {
    return <NotFound message="Richiesta non trovata" />;
  }

  const getStatusBadge = (stato: string) => {
    switch (stato) {
      case "in_attesa":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            In Attesa
          </Badge>
        );
      case "approvata":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approvata
          </Badge>
        );
      case "rifiutata":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Rifiutata
          </Badge>
        );
      default:
        return <Badge variant="outline">{stato}</Badge>;
    }
  };

  const handleApprova = () => {
    approvaMutation.mutate({
      numeroScatole,
      ripetibile,
      numeroRipetizioni,
    });
  };

  const handleRifiuta = () => {
    if (!motivoRifiuto.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un motivo per il rifiuto",
        variant: "destructive",
      });
      return;
    }
    rifiutaMutation.mutate(motivoRifiuto);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/medico/richieste-rinnovo">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alle richieste
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Dettaglio Richiesta Rinnovo</h1>
            <p className="text-gray-600 mt-1">Richiesta #{richiesta.id}</p>
          </div>
        </div>
        {getStatusBadge(richiesta.stato)}
      </div>

      {/* Alert Giorni Rimanenti */}
      {richiesta.giorniRimanenti <= 7 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">
              <strong>Urgente:</strong> Rimangono solo {richiesta.giorniRimanenti} giorni prima
              della scadenza della terapia.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Informazioni Principali */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Dettagli Paziente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Paziente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600">Nome Completo</p>
              <p className="text-lg font-semibold">
                {richiesta.paziente?.nome} {richiesta.paziente?.cognome}
              </p>
            </div>
            {richiesta.paziente?.codiceFiscale && (
              <div>
                <p className="text-sm font-medium text-gray-600">Codice Fiscale</p>
                <p className="text-sm font-mono">{richiesta.paziente.codiceFiscale}</p>
              </div>
            )}
            {richiesta.paziente && (
              <Link href={`/medico/pazienti/${richiesta.paziente.id}/prescrizioni`}>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Vedi Report Prescrizioni
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Informazioni Terapia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Terapia Attuale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {richiesta.terapia?.farmaco && (
              <div>
                <p className="text-sm font-medium text-gray-600">Farmaco</p>
                <p className="text-lg font-semibold">
                  {richiesta.terapia.farmaco.nomeCommerciale}
                </p>
                {richiesta.terapia.farmaco.principioAttivo && (
                  <p className="text-sm text-gray-600">
                    {richiesta.terapia.farmaco.principioAttivo}
                  </p>
                )}
              </div>
            )}
            {richiesta.terapia?.posologia && (
              <div>
                <p className="text-sm font-medium text-gray-600">Posologia</p>
                <p className="text-sm">{richiesta.terapia.posologia}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600">Giorni Rimanenti</p>
              <p
                className={`text-lg font-semibold ${
                  richiesta.giorniRimanenti <= 7
                    ? "text-red-600"
                    : richiesta.giorniRimanenti <= 14
                    ? "text-yellow-600"
                    : ""
                }`}
              >
                {richiesta.giorniRimanenti} giorni
              </p>
            </div>
            {richiesta.prescrizione && (
              <div>
                <p className="text-sm font-medium text-gray-600">Prescrizione Originale</p>
                <Link href={`/medico/prescrizioni/${richiesta.prescrizione.id}`}>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    Vedi Prescrizione #{richiesta.prescrizione.id}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dettagli Richiesta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dettagli Richiesta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Richiesta</p>
              <p className="text-sm">
                {new Date(richiesta.dataRichiesta).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Quantità Scatole Richieste</p>
              <p className="text-sm font-semibold">{richiesta.quantitaScatole} scatole</p>
            </div>
          </div>
          {richiesta.motivo && (
            <div>
              <p className="text-sm font-medium text-gray-600">Motivo Richiesta</p>
              <p className="text-sm whitespace-pre-wrap">{richiesta.motivo}</p>
            </div>
          )}
          {richiesta.noteMedico && (
            <div>
              <p className="text-sm font-medium text-gray-600">Note Medico</p>
              <p className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded">
                {richiesta.noteMedico}
              </p>
            </div>
          )}
          {richiesta.nuovaPrescrizione && (
            <div>
              <p className="text-sm font-medium text-gray-600">Nuova Prescrizione Creata</p>
              <Link href={`/medico/prescrizioni/${richiesta.nuovaPrescrizione.id}`}>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  Vedi Prescrizione #{richiesta.nuovaPrescrizione.id}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Azioni */}
      {richiesta.stato === "in_attesa" && (
        <Card>
          <CardHeader>
            <CardTitle>Azioni</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={() => {
                setNumeroScatole(richiesta.quantitaScatole);
                setRipetibile(richiesta.ripetibile);
                setNumeroRipetizioni(richiesta.numeroRipetizioni || 5);
                setShowApprovaDialog(true);
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approva Richiesta
            </Button>
            <Button
              onClick={() => setShowRifiutaDialog(true)}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rifiuta Richiesta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog Approva */}
      <Dialog open={showApprovaDialog} onOpenChange={setShowApprovaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Approva Richiesta Rinnovo</DialogTitle>
            <DialogDescription>
              Configura i parametri della nuova prescrizione da creare.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="numeroScatole">Numero Scatole *</Label>
              <Input
                id="numeroScatole"
                type="number"
                min="1"
                value={numeroScatole}
                onChange={(e) => setNumeroScatole(parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ripetibile"
                checked={ripetibile}
                onCheckedChange={(checked) => setRipetibile(checked === true)}
              />
              <Label htmlFor="ripetibile" className="cursor-pointer">
                Prescrizione ripetibile
              </Label>
            </div>
            {ripetibile && (
              <div>
                <Label htmlFor="numeroRipetizioni">Numero Ripetizioni</Label>
                <Input
                  id="numeroRipetizioni"
                  type="number"
                  min="1"
                  max="10"
                  value={numeroRipetizioni}
                  onChange={(e) => setNumeroRipetizioni(parseInt(e.target.value) || 1)}
                  className="mt-2"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovaDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleApprova}
              disabled={approvaMutation.isPending || numeroScatole <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {approvaMutation.isPending ? "Approvazione..." : "Conferma Approvazione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Rifiuta */}
      <Dialog open={showRifiutaDialog} onOpenChange={setShowRifiutaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rifiuta Richiesta Rinnovo</DialogTitle>
            <DialogDescription>
              Inserisci il motivo del rifiuto. Il paziente riceverà una notifica.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="motivo">Motivo del rifiuto *</Label>
            <Textarea
              id="motivo"
              value={motivoRifiuto}
              onChange={(e) => setMotivoRifiuto(e.target.value)}
              placeholder="Es: Necessario consulto in presenza per valutazione clinica..."
              className="mt-2"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRifiutaDialog(false)}>
              Annulla
            </Button>
            <Button
              onClick={handleRifiuta}
              disabled={rifiutaMutation.isPending || !motivoRifiuto.trim()}
              variant="destructive"
            >
              {rifiutaMutation.isPending ? "Rifiuto..." : "Conferma Rifiuto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

