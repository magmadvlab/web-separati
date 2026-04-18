"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Calendar,
  Syringe,
  Pill,
  Stethoscope,
  Weight,
  Heart,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { toast } from "sonner";
import api from "@/lib/api";

interface Animale {
  id: number;
  nome: string;
  specie: string;
  razza?: string;
  dataNascita?: string;
  peso?: number;
}

interface VoceDiario {
  id: number;
  animaleId: number;
  data: string;
  tipo: string; // vaccinazione, visita, farmaco, peso, altro
  titolo: string;
  descrizione?: string;
  veterinario?: string;
  farmaco?: string;
  dosaggio?: string;
  peso?: number;
  createdAt: string;
}

export default function DiarioAnimalePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const animaleId = parseInt(params.id as string);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split("T")[0],
    tipo: "altro",
    titolo: "",
    descrizione: "",
    veterinario: "",
    farmaco: "",
    dosaggio: "",
    peso: "",
  });

  // Fetch animale
  const { data: animale, isLoading: loadingAnimale } = useQuery({
    queryKey: ["animale", animaleId],
    queryFn: async () => {
      const response = await api.get(`/paziente/animali/${animaleId}`);
      return response.data.data as Animale;
    },
  });

  // Fetch diario
  const { data: voci = [], isLoading: loadingDiario } = useQuery({
    queryKey: ["diario-animale", animaleId],
    queryFn: async () => {
      const response = await api.get(`/paziente/animali/${animaleId}/diario`);
      return response.data.data as VoceDiario[];
    },
  });

  // Mutation per aggiungere voce
  const addVoceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post(`/paziente/animali/${animaleId}/diario`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario-animale", animaleId] });
      toast.success("Voce aggiunta al diario");
      setShowForm(false);
      setFormData({
        data: new Date().toISOString().split("T")[0],
        tipo: "altro",
        titolo: "",
        descrizione: "",
        veterinario: "",
        farmaco: "",
        dosaggio: "",
        peso: "",
      });
    },
    onError: () => {
      toast.error("Errore nell'aggiunta della voce");
    },
  });

  // Mutation per eliminare voce
  const deleteVoceMutation = useMutation({
    mutationFn: async (voceId: number) => {
      await api.delete(`/paziente/animali/${animaleId}/diario/${voceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario-animale", animaleId] });
      toast.success("Voce eliminata");
    },
    onError: () => {
      toast.error("Errore nell'eliminazione");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: any = {
      data: formData.data,
      tipo: formData.tipo,
      titolo: formData.titolo,
      descrizione: formData.descrizione || undefined,
    };

    if (formData.tipo === "vaccinazione" || formData.tipo === "visita") {
      payload.veterinario = formData.veterinario || undefined;
    }

    if (formData.tipo === "farmaco") {
      payload.farmaco = formData.farmaco || undefined;
      payload.dosaggio = formData.dosaggio || undefined;
    }

    if (formData.tipo === "peso" && formData.peso) {
      payload.peso = parseFloat(formData.peso);
    }

    addVoceMutation.mutate(payload);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "vaccinazione":
        return <Syringe className="w-5 h-5 text-blue-600" />;
      case "visita":
        return <Stethoscope className="w-5 h-5 text-green-600" />;
      case "farmaco":
        return <Pill className="w-5 h-5 text-purple-600" />;
      case "peso":
        return <Weight className="w-5 h-5 text-orange-600" />;
      default:
        return <Heart className="w-5 h-5 text-pink-600" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "vaccinazione":
        return "bg-blue-50 border-blue-200";
      case "visita":
        return "bg-green-50 border-green-200";
      case "farmaco":
        return "bg-purple-50 border-purple-200";
      case "peso":
        return "bg-orange-50 border-orange-200";
      default:
        return "bg-pink-50 border-pink-200";
    }
  };

  if (loadingAnimale) {
    return <div className="p-6">Caricamento...</div>;
  }

  if (!animale) {
    return <div className="p-6">Animale non trovato</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/paziente/profilo/animali")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Diario di {animale.nome}</h1>
            <p className="text-gray-600">
              {animale.specie} {animale.razza && `- ${animale.razza}`}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Aggiungi Voce
        </Button>
      </div>

      {/* Form Nuova Voce */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Nuova Voce Diario</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) =>
                      setFormData({ ...formData, data: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vaccinazione">Vaccinazione</SelectItem>
                      <SelectItem value="visita">Visita Veterinaria</SelectItem>
                      <SelectItem value="farmaco">Farmaco</SelectItem>
                      <SelectItem value="peso">Peso</SelectItem>
                      <SelectItem value="altro">Altro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Titolo</Label>
                <Input
                  value={formData.titolo}
                  onChange={(e) =>
                    setFormData({ ...formData, titolo: e.target.value })
                  }
                  placeholder="Es: Vaccino antirabbica"
                  required
                />
              </div>

              {(formData.tipo === "vaccinazione" || formData.tipo === "visita") && (
                <div>
                  <Label>Veterinario</Label>
                  <Input
                    value={formData.veterinario}
                    onChange={(e) =>
                      setFormData({ ...formData, veterinario: e.target.value })
                    }
                    placeholder="Nome del veterinario"
                  />
                </div>
              )}

              {formData.tipo === "farmaco" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Farmaco</Label>
                    <Input
                      value={formData.farmaco}
                      onChange={(e) =>
                        setFormData({ ...formData, farmaco: e.target.value })
                      }
                      placeholder="Nome farmaco"
                    />
                  </div>
                  <div>
                    <Label>Dosaggio</Label>
                    <Input
                      value={formData.dosaggio}
                      onChange={(e) =>
                        setFormData({ ...formData, dosaggio: e.target.value })
                      }
                      placeholder="Es: 1 compressa 2 volte al giorno"
                    />
                  </div>
                </div>
              )}

              {formData.tipo === "peso" && (
                <div>
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.peso}
                    onChange={(e) =>
                      setFormData({ ...formData, peso: e.target.value })
                    }
                    placeholder="Es: 12.5"
                  />
                </div>
              )}

              <div>
                <Label>Note</Label>
                <Textarea
                  value={formData.descrizione}
                  onChange={(e) =>
                    setFormData({ ...formData, descrizione: e.target.value })
                  }
                  placeholder="Aggiungi dettagli..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={addVoceMutation.isPending}>
                  {addVoceMutation.isPending ? "Salvataggio..." : "Salva"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Annulla
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      {/* Lista Voci Diario */}
      <div className="space-y-4">
        {loadingDiario ? (
          <Card className="p-6">
            <p className="text-center text-gray-500">Caricamento diario...</p>
          </Card>
        ) : voci.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nessuna voce nel diario
            </h3>
            <p className="text-gray-500 mb-4">
              Inizia a registrare visite, vaccinazioni e altri eventi
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Aggiungi Prima Voce
            </Button>
          </Card>
        ) : (
          voci.map((voce) => (
            <motion.div
              key={voce.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={`p-4 border-2 ${getTipoColor(voce.tipo)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    <div className="mt-1">{getTipoIcon(voce.tipo)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{voce.titolo}</h3>
                        <span className="text-xs text-gray-500">
                          {new Date(voce.data).toLocaleDateString("it-IT")}
                        </span>
                      </div>
                      {voce.descrizione && (
                        <p className="text-sm text-gray-700 mb-2">
                          {voce.descrizione}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {voce.veterinario && (
                          <span className="bg-white px-2 py-1 rounded">
                            Vet: {voce.veterinario}
                          </span>
                        )}
                        {voce.farmaco && (
                          <span className="bg-white px-2 py-1 rounded">
                            {voce.farmaco}
                            {voce.dosaggio && ` - ${voce.dosaggio}`}
                          </span>
                        )}
                        {voce.peso && (
                          <span className="bg-white px-2 py-1 rounded font-semibold">
                            {voce.peso} kg
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Eliminare questa voce?")) {
                        deleteVoceMutation.mutate(voce.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
