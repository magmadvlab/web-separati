"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/shared/Loading";
import { toast } from "sonner";
import { 
  Stethoscope, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  Trash2,
  Send,
  Target,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import type { ApiResponse } from "@/types/api";

interface Farmaco {
  nome: string;
  principioAttivo: string;
  quantita: number;
  prezzoStimato?: number;
}

interface PrescrizioneDiretta {
  pazienteId: number;
  prescrizioneId: number;
  farmaci: Farmaco[];
  indirizzoConsegna: string;
  livelloUrgenza: 'normale' | 'urgente' | 'critico';
  finestraOraria?: string;
  noteMedico?: string;
}

interface AssignmentResult {
  ordineId: number;
  cittaAssegnata: string;
  zonaAssegnata: string;
  farmaciaAssegnata: string;
  deliveryAssegnato: string;
  tempoAssegnazione: string;
  algoritmo: string;
  dettagli: {
    cittaId: number;
    zonaId?: number;
    farmaciaId: number;
    deliveryId: number;
  };
}

export default function PrescrizioneDirettaPage() {
  const queryClient = useQueryClient();
  
  // Form state
  const [formData, setFormData] = useState<PrescrizioneDiretta>({
    pazienteId: 0,
    prescrizioneId: 0,
    farmaci: [{ nome: '', principioAttivo: '', quantita: 1, prezzoStimato: 10 }],
    indirizzoConsegna: '',
    livelloUrgenza: 'normale',
    finestraOraria: '',
    noteMedico: ''
  });

  const [lastAssignment, setLastAssignment] = useState<AssignmentResult | null>(null);

  // Query pazienti (simulata)
  const { data: pazienti } = useQuery({
    queryKey: ["medico-pazienti"],
    queryFn: async () => {
      // Simulazione pazienti per test
      return [
        { id: 1, nome: 'Mario', cognome: 'Rossi', indirizzo: 'Via Roma 123, Matera' },
        { id: 2, nome: 'Giulia', cognome: 'Verdi', indirizzo: 'Via Dante 45, Pisticci' },
        { id: 3, nome: 'Luca', cognome: 'Bianchi', indirizzo: 'Via Garibaldi 78, Matera Nord' },
        { id: 4, nome: 'Anna', cognome: 'Neri', indirizzo: 'Via Mazzini 12, Bernalda' }
      ];
    },
  });

  // Mutation per prescrizione diretta
  const prescrizioneMutation = useMutation({
    mutationFn: async (data: PrescrizioneDiretta) => {
      const response = await api.post<ApiResponse<AssignmentResult>>(
        "/territorial/medico/prescrizione-diretta",
        data
      );
      return response.data;
    },
    onSuccess: (response) => {
      if (response.success) {
        setLastAssignment(response.data);
        toast.success("Prescrizione assegnata automaticamente!", {
          description: `Assegnata a ${response.data.farmaciaAssegnata} e ${response.data.deliveryAssegnato}`
        });
        
        // Reset form
        setFormData({
          pazienteId: 0,
          prescrizioneId: 0,
          farmaci: [{ nome: '', principioAttivo: '', quantita: 1, prezzoStimato: 10 }],
          indirizzoConsegna: '',
          livelloUrgenza: 'normale',
          finestraOraria: '',
          noteMedico: ''
        });
      } else {
        toast.error("Errore nell'assegnazione", {
          description: response.message || "Errore sconosciuto"
        });
      }
    },
    onError: (error: any) => {
      toast.error("Errore nella prescrizione", {
        description: error.response?.data?.message || error.message
      });
    },
  });

  // Handlers
  const handlePazienteChange = (pazienteId: string) => {
    const id = parseInt(pazienteId);
    const paziente = pazienti?.find(p => p.id === id);
    
    setFormData(prev => ({
      ...prev,
      pazienteId: id,
      prescrizioneId: Date.now(), // Genera ID prescrizione
      indirizzoConsegna: paziente?.indirizzo || ''
    }));
  };

  const addFarmaco = () => {
    setFormData(prev => ({
      ...prev,
      farmaci: [...prev.farmaci, { nome: '', principioAttivo: '', quantita: 1, prezzoStimato: 10 }]
    }));
  };

  const removeFarmaco = (index: number) => {
    setFormData(prev => ({
      ...prev,
      farmaci: prev.farmaci.filter((_, i) => i !== index)
    }));
  };

  const updateFarmaco = (index: number, field: keyof Farmaco, value: any) => {
    setFormData(prev => ({
      ...prev,
      farmaci: prev.farmaci.map((farmaco, i) => 
        i === index ? { ...farmaco, [field]: value } : farmaco
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pazienteId) {
      toast.error("Seleziona un paziente");
      return;
    }
    
    if (!formData.indirizzoConsegna) {
      toast.error("Inserisci l'indirizzo di consegna");
      return;
    }
    
    if (formData.farmaci.some(f => !f.nome || !f.principioAttivo)) {
      toast.error("Completa tutti i farmaci");
      return;
    }

    prescrizioneMutation.mutate(formData);
  };

  const getUrgencyColor = (urgenza: string) => {
    switch (urgenza) {
      case 'critico': return 'bg-red-100 text-red-800 border-red-200';
      case 'urgente': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getAlgorithmIcon = (algoritmo: string) => {
    switch (algoritmo) {
      case 'auto_zona': return <Target className="h-4 w-4" />;
      case 'auto_citta': return <MapPin className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-green-500/20 via-green-400/10 to-transparent p-6 border border-green-200"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
            Prescrizione Diretta
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema territoriale automatico: Medico → Sistema → Delivery
          </p>
          <div className="flex gap-2 mt-3">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Target className="h-3 w-3 mr-1" />
              Assegnazione Automatica
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Zap className="h-3 w-3 mr-1" />
              Territoriale Completo
            </Badge>
          </div>
        </div>
        <div className="absolute inset-0 shimmer opacity-30" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Prescrizione */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-green-600" />
                Nuova Prescrizione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selezione Paziente */}
                <div>
                  <Label htmlFor="paziente">Paziente</Label>
                  <Select onValueChange={handlePazienteChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona paziente" />
                    </SelectTrigger>
                    <SelectContent>
                      {pazienti?.map((paziente) => (
                        <SelectItem key={paziente.id} value={paziente.id.toString()}>
                          {paziente.nome} {paziente.cognome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Indirizzo Consegna */}
                <div>
                  <Label htmlFor="indirizzo">Indirizzo Consegna</Label>
                  <Input
                    id="indirizzo"
                    value={formData.indirizzoConsegna}
                    onChange={(e) => setFormData(prev => ({ ...prev, indirizzoConsegna: e.target.value }))}
                    placeholder="Via, Numero, Città"
                  />
                </div>

                {/* Farmaci */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Farmaci da Prescrivere</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addFarmaco}>
                      <Plus className="h-4 w-4 mr-1" />
                      Aggiungi
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {formData.farmaci.map((farmaco, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50">
                        <div className="grid gap-2 md:grid-cols-4">
                          <Input
                            placeholder="Nome farmaco"
                            value={farmaco.nome}
                            onChange={(e) => updateFarmaco(index, 'nome', e.target.value)}
                          />
                          <Input
                            placeholder="Principio attivo"
                            value={farmaco.principioAttivo}
                            onChange={(e) => updateFarmaco(index, 'principioAttivo', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="Quantità"
                            value={farmaco.quantita}
                            onChange={(e) => updateFarmaco(index, 'quantita', parseInt(e.target.value) || 1)}
                          />
                          <div className="flex gap-1">
                            <Input
                              type="number"
                              placeholder="€"
                              value={farmaco.prezzoStimato}
                              onChange={(e) => updateFarmaco(index, 'prezzoStimato', parseFloat(e.target.value) || 0)}
                            />
                            {formData.farmaci.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeFarmaco(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Livello Urgenza */}
                <div>
                  <Label htmlFor="urgenza">Livello Urgenza</Label>
                  <Select 
                    value={formData.livelloUrgenza} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, livelloUrgenza: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normale">Normale</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                      <SelectItem value="critico">Critico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Finestra Oraria */}
                <div>
                  <Label htmlFor="finestra">Finestra Oraria (opzionale)</Label>
                  <Input
                    id="finestra"
                    value={formData.finestraOraria}
                    onChange={(e) => setFormData(prev => ({ ...prev, finestraOraria: e.target.value }))}
                    placeholder="es: 14:00-16:00"
                  />
                </div>

                {/* Note */}
                <div>
                  <Label htmlFor="note">Note per il Delivery</Label>
                  <Textarea
                    id="note"
                    value={formData.noteMedico}
                    onChange={(e) => setFormData(prev => ({ ...prev, noteMedico: e.target.value }))}
                    placeholder="Istruzioni speciali per la consegna..."
                    rows={3}
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={prescrizioneMutation.isPending}
                >
                  {prescrizioneMutation.isPending ? (
                    <Loading />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Invia Prescrizione Diretta
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risultato Assegnazione */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {lastAssignment ? (
            <Card className="border-green-200 bg-green-50/30 hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Assegnazione Completata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium">Ordine ID</span>
                    <Badge variant="outline">#{lastAssignment.ordineId}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium">Città</span>
                    <span className="text-sm">{lastAssignment.cittaAssegnata}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium">Zona</span>
                    <span className="text-sm">{lastAssignment.zonaAssegnata}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium">Farmacia</span>
                    <span className="text-sm font-medium text-blue-600">{lastAssignment.farmaciaAssegnata}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium">Delivery</span>
                    <span className="text-sm font-medium text-green-600">{lastAssignment.deliveryAssegnato}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium">Algoritmo</span>
                    <div className="flex items-center gap-1">
                      {getAlgorithmIcon(lastAssignment.algoritmo)}
                      <span className="text-sm">{lastAssignment.algoritmo}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="text-sm font-medium">Tempo Assegnazione</span>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      <Clock className="h-3 w-3 mr-1" />
                      {lastAssignment.tempoAssegnazione}
                    </Badge>
                  </div>
                </div>

                <div className="p-4 bg-green-100 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Sistema Territoriale Attivo</span>
                  </div>
                  <p className="text-xs text-green-700">
                    La prescrizione è stata assegnata automaticamente in base alla posizione geografica del paziente. 
                    Il delivery riceverà una notifica immediata.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200 bg-gray-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-gray-400" />
                  In Attesa di Prescrizione
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    Compila il form per vedere l'assegnazione automatica territoriale
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}