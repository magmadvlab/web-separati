"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Plus, Calendar, FileText, Stethoscope } from "lucide-react";

interface Destinatario {
  id: number;
  tipo: 'medico' | 'specialista';
  nome: string;
  cognome: string;
  specializzazione?: string;
  macroArea?: string;
  email: string;
  relazione: string;
}

interface PermessoConsulto {
  id: number;
  medicoId?: number;
  specialistaId?: number;
  livelloAccesso: string;
  dataInizio: string;
  dataFine?: string;
  stato: string;
  note?: string;
  medico?: {
    nome: string;
    cognome: string;
  };
  specialista?: {
    nome: string;
    cognome: string;
    specializzazione?: string;
  };
}

export function ConsultiPaziente() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDestinatario, setSelectedDestinatario] = useState<string>("");
  const [tipoAccesso, setTipoAccesso] = useState<"lettura" | "lettura_scrittura">("lettura");
  const [durataMesi, setDurataMesi] = useState<string>("3");
  const [note, setNote] = useState("");
  const [includiReferti, setIncludiReferti] = useState(true);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carica destinatari disponibili
  const { data: destinatari, isLoading: loadingDestinatari } = useQuery<Destinatario[]>({
    queryKey: ["paziente-consulti-destinatari"],
    queryFn: async () => {
      const response = await api.get("/paziente/consulti/destinatari");
      return response.data.data;
    },
  });

  // Carica permessi attivi
  const { data: permessi, isLoading: loadingPermessi } = useQuery<PermessoConsulto[]>({
    queryKey: ["paziente-consulti-permessi"],
    queryFn: async () => {
      const response = await api.get("/cartella-clinica/permessi");
      return response.data.data;
    },
  });

  // Mutation per creare permesso
  const createPermessoMutation = useMutation({
    mutationFn: async (data: {
      destinatarioId: number;
      tipoDestinatario: 'medico' | 'specialista';
      tipoAccesso: 'lettura' | 'lettura_scrittura';
      durataMesi?: number;
      note?: string;
      includiReferti?: boolean;
    }) => {
      const response = await api.post("/paziente/consulti/permessi", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-consulti-permessi"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "✅ Permesso creato",
        description: "Il medico/specialista può ora accedere alla tua cartella clinica",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore",
        description: error.response?.data?.message || "Errore nella creazione del permesso",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedDestinatario("");
    setTipoAccesso("lettura");
    setDurataMesi("3");
    setNote("");
    setIncludiReferti(true);
  };

  const handleSubmit = () => {
    if (!selectedDestinatario) {
      toast({
        title: "⚠️ Attenzione",
        description: "Seleziona un medico o specialista",
        variant: "destructive",
      });
      return;
    }

    const [tipoDestinatario, destinatarioId] = selectedDestinatario.split("-");
    
    createPermessoMutation.mutate({
      destinatarioId: parseInt(destinatarioId),
      tipoDestinatario: tipoDestinatario as 'medico' | 'specialista',
      tipoAccesso,
      durataMesi: durataMesi ? parseInt(durataMesi) : undefined,
      note,
      includiReferti,
    });
  };

  if (loadingDestinatari || loadingPermessi) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Consulti medici</h2>
          <p className="text-sm text-gray-600">
            Gestisci l'accesso dei medici alla tua cartella clinica
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo consulto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Autorizza consulto medico</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Medico/Specialista</label>
                <Select value={selectedDestinatario} onValueChange={setSelectedDestinatario}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona medico o specialista" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinatari?.map((dest) => (
                      <SelectItem key={`${dest.tipo}-${dest.id}`} value={`${dest.tipo}-${dest.id}`}>
                        <div className="flex items-center space-x-2">
                          {dest.tipo === 'medico' ? (
                            <Stethoscope className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                          <span>
                            Dr. {dest.nome} {dest.cognome}
                            {dest.specializzazione && ` - ${dest.specializzazione}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tipo di accesso</label>
                <Select value={tipoAccesso} onValueChange={(value: "lettura" | "lettura_scrittura") => setTipoAccesso(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lettura">Solo lettura</SelectItem>
                    <SelectItem value="lettura_scrittura">Lettura e scrittura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Durata (mesi)</label>
                <Select value={durataMesi} onValueChange={setDurataMesi}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 mese</SelectItem>
                    <SelectItem value="3">3 mesi</SelectItem>
                    <SelectItem value="6">6 mesi</SelectItem>
                    <SelectItem value="12">12 mesi</SelectItem>
                    <SelectItem value="">Permanente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includiReferti"
                  checked={includiReferti}
                  onCheckedChange={(checked) => setIncludiReferti(checked as boolean)}
                />
                <label htmlFor="includiReferti" className="text-sm">
                  Includi accesso ai referti di laboratorio
                </label>
              </div>

              <div>
                <label className="text-sm font-medium">Note (opzionale)</label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Motivo del consulto o note aggiuntive..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={createPermessoMutation.isPending}
                  className="flex-1"
                >
                  {createPermessoMutation.isPending ? "Creazione..." : "Autorizza consulto"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={createPermessoMutation.isPending}
                >
                  Annulla
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista permessi attivi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5" />
            <span>Consulti attivi</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!permessi || permessi.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nessun consulto attivo</p>
              <p className="text-sm">Autorizza un medico per iniziare un consulto</p>
            </div>
          ) : (
            <div className="space-y-4">
              {permessi.map((permesso) => (
                <div
                  key={permesso.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">
                          {permesso.medico 
                            ? `Dr. ${permesso.medico.nome} ${permesso.medico.cognome}`
                            : `Dr. ${permesso.specialista?.nome} ${permesso.specialista?.cognome}`
                          }
                        </h3>
                        <Badge variant={permesso.stato === 'attivo' ? 'default' : 'secondary'}>
                          {permesso.stato}
                        </Badge>
                        <Badge variant="outline">
                          {permesso.livelloAccesso === 'lettura' ? 'Solo lettura' : 'Lettura/Scrittura'}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        {permesso.specialista?.specializzazione && (
                          <p><strong>Specializzazione:</strong> {permesso.specialista.specializzazione}</p>
                        )}
                        <p><strong>Inizio:</strong> {new Date(permesso.dataInizio).toLocaleDateString('it-IT')}</p>
                        {permesso.dataFine && (
                          <p><strong>Scadenza:</strong> {new Date(permesso.dataFine).toLocaleDateString('it-IT')}</p>
                        )}
                        {permesso.note && (
                          <p><strong>Note:</strong> {permesso.note}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-1" />
                        Dettagli
                      </Button>
                      <Button size="sm" variant="outline">
                        Revoca
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}