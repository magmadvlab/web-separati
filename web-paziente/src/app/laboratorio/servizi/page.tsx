"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { Plus, Edit, Trash2, Euro, CheckCircle2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface Servizio {
  id: number;
  tipoServizio: string;
  nome: string;
  descrizione?: string;
  codiceTariffario?: string;
  convenzionato: boolean;
  tipoPagamento: string;
  prezzoBase?: number;
  prezzoConvenzionato?: number;
  disponibile: boolean;
  giorniAttesa?: number;
  prenotabileOnline: boolean;
  richiedePrescrizione: boolean;
  consegnabile: boolean;
}

export default function ServiziPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [servizioEdit, setServizioEdit] = useState<Servizio | null>(null);
  const [formData, setFormData] = useState({
    tipoServizio: "",
    nome: "",
    descrizione: "",
    codiceTariffario: "",
    convenzionato: false,
    tipoPagamento: "SSN" as "SSN" | "privato" | "misto",
    prezzoBase: "",
    prezzoConvenzionato: "",
    disponibile: true,
    giorniAttesa: "",
    prenotabileOnline: true,
    richiedePrescrizione: true,
    consegnabile: false,
  });

  const { data: servizi, isLoading } = useQuery<Servizio[]>({
    queryKey: ["servizi-laboratorio"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Servizio[]>>("/laboratori/dashboard/servizi");
      return response.data.data || [];
    },
  });

  const creaServizioMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<Servizio>>("/laboratori/dashboard/servizi", data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servizi-laboratorio"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Servizio creato",
        description: "Il servizio è stato creato con successo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.error || "Errore durante la creazione",
        variant: "destructive",
      });
    },
  });

  const aggiornaServizioMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await api.put<ApiResponse<Servizio>>(`/laboratori/dashboard/servizi/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servizi-laboratorio"] });
      setIsDialogOpen(false);
      setServizioEdit(null);
      resetForm();
      toast({
        title: "Servizio aggiornato",
        description: "Il servizio è stato aggiornato con successo",
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

  const eliminaServizioMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/laboratori/dashboard/servizi/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servizi-laboratorio"] });
      toast({
        title: "Servizio eliminato",
        description: "Il servizio è stato eliminato con successo",
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

  const resetForm = () => {
    setFormData({
      tipoServizio: "",
      nome: "",
      descrizione: "",
      codiceTariffario: "",
      convenzionato: false,
      tipoPagamento: "SSN",
      prezzoBase: "",
      prezzoConvenzionato: "",
      disponibile: true,
      giorniAttesa: "",
      prenotabileOnline: true,
      richiedePrescrizione: true,
      consegnabile: false,
    });
    setServizioEdit(null);
  };

  const handleEdit = (servizio: Servizio) => {
    setServizioEdit(servizio);
    setFormData({
      tipoServizio: servizio.tipoServizio,
      nome: servizio.nome,
      descrizione: servizio.descrizione || "",
      codiceTariffario: servizio.codiceTariffario || "",
      convenzionato: servizio.convenzionato,
      tipoPagamento: servizio.tipoPagamento as "SSN" | "privato" | "misto",
      prezzoBase: servizio.prezzoBase?.toString() || "",
      prezzoConvenzionato: servizio.prezzoConvenzionato?.toString() || "",
      disponibile: servizio.disponibile,
      giorniAttesa: servizio.giorniAttesa?.toString() || "",
      prenotabileOnline: servizio.prenotabileOnline,
      richiedePrescrizione: servizio.richiedePrescrizione,
      consegnabile: servizio.consegnabile,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      tipoServizio: formData.tipoServizio,
      nome: formData.nome,
      descrizione: formData.descrizione || undefined,
      codiceTariffario: formData.codiceTariffario || undefined,
      convenzionato: formData.convenzionato,
      tipoPagamento: formData.tipoPagamento,
      disponibile: formData.disponibile,
      prenotabileOnline: formData.prenotabileOnline,
      richiedePrescrizione: formData.richiedePrescrizione,
      consegnabile: formData.consegnabile,
    };

    if (formData.prezzoBase) {
      data.prezzoBase = parseFloat(formData.prezzoBase);
    }
    if (formData.prezzoConvenzionato) {
      data.prezzoConvenzionato = parseFloat(formData.prezzoConvenzionato);
    }
    if (formData.giorniAttesa) {
      data.giorniAttesa = parseInt(formData.giorniAttesa);
    }

    if (servizioEdit) {
      aggiornaServizioMutation.mutate({ id: servizioEdit.id, data });
    } else {
      creaServizioMutation.mutate(data);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header con gradiente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent p-6 border border-blue-500/20"
      >
        <div className="absolute inset-0 shimmer opacity-30" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Gestione Servizi
            </h1>
            <p className="text-gray-600 mt-2">Gestisci i servizi offerti dal laboratorio</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Servizio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass border-white/20">
            <DialogHeader>
              <DialogTitle>{servizioEdit ? "Modifica Servizio" : "Nuovo Servizio"}</DialogTitle>
              <DialogDescription>
                {servizioEdit ? "Modifica i dettagli del servizio" : "Aggiungi un nuovo servizio offerto dal laboratorio"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipoServizio">Tipo Servizio *</Label>
                  <Select
                    value={formData.tipoServizio}
                    onValueChange={(value) => setFormData({ ...formData, tipoServizio: value })}
                    required
                  >
                    <SelectTrigger id="tipoServizio">
                      <SelectValue placeholder="Seleziona tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="esame_sangue">Esami del Sangue</SelectItem>
                      <SelectItem value="radiografia">Radiografia</SelectItem>
                      <SelectItem value="risonanza">Risonanza Magnetica</SelectItem>
                      <SelectItem value="ecografia">Ecografia</SelectItem>
                      <SelectItem value="ecg">ECG</SelectItem>
                      <SelectItem value="altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Servizio *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descrizione">Descrizione</Label>
                  <Input
                    id="descrizione"
                    value={formData.descrizione}
                    onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codiceTariffario">Codice Tariffario</Label>
                  <Input
                    id="codiceTariffario"
                    value={formData.codiceTariffario}
                    onChange={(e) => setFormData({ ...formData, codiceTariffario: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoPagamento">Tipo Pagamento *</Label>
                  <Select
                    value={formData.tipoPagamento}
                    onValueChange={(value: "SSN" | "privato" | "misto") =>
                      setFormData({ ...formData, tipoPagamento: value })
                    }
                    required
                  >
                    <SelectTrigger id="tipoPagamento">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SSN">SSN</SelectItem>
                      <SelectItem value="privato">Privato</SelectItem>
                      <SelectItem value="misto">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipoPagamento !== "SSN" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="prezzoBase">Prezzo Base (€)</Label>
                      <Input
                        id="prezzoBase"
                        type="number"
                        step="0.01"
                        value={formData.prezzoBase}
                        onChange={(e) => setFormData({ ...formData, prezzoBase: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prezzoConvenzionato">Prezzo Convenzionato (€)</Label>
                      <Input
                        id="prezzoConvenzionato"
                        type="number"
                        step="0.01"
                        value={formData.prezzoConvenzionato}
                        onChange={(e) => setFormData({ ...formData, prezzoConvenzionato: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="giorniAttesa">Giorni Attesa</Label>
                  <Input
                    id="giorniAttesa"
                    type="number"
                    value={formData.giorniAttesa}
                    onChange={(e) => setFormData({ ...formData, giorniAttesa: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opzioni</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="convenzionato"
                        checked={formData.convenzionato}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, convenzionato: checked === true })
                        }
                      />
                      <Label htmlFor="convenzionato" className="cursor-pointer">
                        Convenzionato SSN
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="disponibile"
                        checked={formData.disponibile}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, disponibile: checked === true })
                        }
                      />
                      <Label htmlFor="disponibile" className="cursor-pointer">
                        Disponibile
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="prenotabileOnline"
                        checked={formData.prenotabileOnline}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, prenotabileOnline: checked === true })
                        }
                      />
                      <Label htmlFor="prenotabileOnline" className="cursor-pointer">
                        Prenotabile Online
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="richiedePrescrizione"
                        checked={formData.richiedePrescrizione}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, richiedePrescrizione: checked === true })
                        }
                      />
                      <Label htmlFor="richiedePrescrizione" className="cursor-pointer">
                        Richiede Prescrizione
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="consegnabile"
                        checked={formData.consegnabile}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, consegnabile: checked === true })
                        }
                      />
                      <Label htmlFor="consegnabile" className="cursor-pointer">
                        Consegna Domicilio Disponibile
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annulla
                </Button>
                <Button type="submit" disabled={creaServizioMutation.isPending || aggiornaServizioMutation.isPending}>
                  {servizioEdit ? "Aggiorna" : "Crea"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </motion.div>

      {servizi && servizi.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servizi.map((servizio, index) => (
            <motion.div
              key={servizio.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
            >
              <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{servizio.nome}</span>
                  <div className="flex gap-2">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(servizio)}
                        className="hover-lift"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Sei sicuro di voler eliminare questo servizio?")) {
                            eliminaServizioMutation.mutate(servizio.id);
                          }
                        }}
                        className="hover-lift"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Tipo:</span>
                  <span className="text-sm capitalize">{servizio.tipoServizio}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Pagamento:</span>
                  <span className="text-sm capitalize">{servizio.tipoPagamento}</span>
                </div>
                {servizio.prezzoBase && (
                  <div className="flex items-center gap-1 text-sm">
                    <Euro className="h-3 w-3" />
                    <span>Prezzo: €{Number(servizio.prezzoBase).toFixed(2)}</span>
                  </div>
                )}
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {servizio.disponibile ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </motion.div>
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm">{servizio.disponibile ? "Disponibile" : "Non disponibile"}</span>
                </motion.div>
                {servizio.consegnabile && (
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    Consegna disponibile
                  </span>
                )}
              </CardContent>
            </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Nessun servizio configurato</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

