"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Pill, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  Heart,
  Shield,
  AlertCircle,
  Upload,
  Search,
  Plus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DrugSearch } from "@/components/paziente/DrugSearch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

interface Farmaco {
  id: number;
  codiceAic: string;
  nomeCommerciale: string;
  principioAttivo: string;
  formaFarmaceutica?: string;
  dosaggio?: string;
  confezione?: string;
  quantitaConfezione?: number;
  unitaMisura?: string;
  classe?: string;
  ricettaRichiesta: boolean;
  mutuabile: boolean;
  fascia?: string;
  prezzo?: number;
  ticket?: number;
  displayName: string;
}

export default function WizardTerapiePage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [selectedFarmaco, setSelectedFarmaco] = useState<Farmaco | null>(null);
  const [orari, setOrari] = useState<string[]>([""]);
  const [formData, setFormData] = useState({
    posologia: "",
    doseGiornaliera: 1,
    numeroScatole: 1,
    compressePerScatola: 30,
    conPasto: false,
    note: "",
  });

  const steps = [
    {
      id: 0,
      title: "Benvenuto nel Sistema Terapie! 👋",
      subtitle: "Configurazione iniziale obbligatoria",
      icon: Sparkles,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 1,
      title: "Come vuoi iniziare?",
      subtitle: "Scegli il metodo più comodo per te",
      icon: Heart,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: 2,
      title: "Cerca il Farmaco",
      subtitle: "Trova il farmaco nel catalogo",
      icon: Search,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 3,
      title: "Dettagli Terapia",
      subtitle: "Inserisci posologia e orari",
      icon: Pill,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: 4,
      title: "Sistema Inizializzato! 🎉",
      subtitle: "Ora puoi gestire tutte le tue terapie",
      icon: CheckCircle2,
      color: "from-orange-500 to-red-500",
    },
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  // Mutation per creare terapia
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFarmaco) {
        throw new Error("Nessun farmaco selezionato");
      }

      const orariValidi = orari.filter((o) => o.trim().length > 0);
      if (orariValidi.length === 0) {
        throw new Error("Aggiungi almeno un orario di assunzione");
      }

      const response = await api.post<ApiResponse<any>>("/paziente/terapie", {
        farmacoId: selectedFarmaco.id,
        posologia: formData.posologia,
        doseGiornaliera: formData.doseGiornaliera,
        numeroScatole: formData.numeroScatole,
        compressePerScatola: formData.compressePerScatola,
        orariAssunzione: orariValidi,
        conPasto: formData.conPasto,
        note: formData.note,
      });

      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paziente-terapie"] });
      queryClient.invalidateQueries({ queryKey: ["paziente-terapie-reminder"] });
      toast({
        title: "✅ Terapia creata!",
        description: "La tua prima terapia è stata configurata con successo",
      });
      // Vai allo step finale
      setCurrentStep(4);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.message || error?.message || "Errore durante la creazione",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Validazioni per step specifici
      if (currentStep === 2 && !selectedFarmaco) {
        toast({
          title: "Attenzione",
          description: "Seleziona un farmaco prima di continuare",
          variant: "destructive",
        });
        return;
      }

      if (currentStep === 3) {
        // Validazione form terapia
        if (!formData.posologia.trim()) {
          toast({
            title: "Attenzione",
            description: "Inserisci la posologia",
            variant: "destructive",
          });
          return;
        }

        const orariValidi = orari.filter((o) => o.trim().length > 0);
        if (orariValidi.length === 0) {
          toast({
            title: "Attenzione",
            description: "Aggiungi almeno un orario di assunzione",
            variant: "destructive",
          });
          return;
        }

        // Crea la terapia
        createMutation.mutate();
        return;
      }

      setCurrentStep(currentStep + 1);
    } else {
      // Ultimo step - marca come completato e vai alla dashboard
      localStorage.setItem("terapieWizardCompleted", "true");
      router.push("/paziente/dashboard");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    if (method === "manual") {
      // Vai allo step di ricerca farmaco
      setCurrentStep(2);
    } else if (method === "prescription") {
      // Vai alla pagina di richiesta prescrizione
      localStorage.setItem("terapieWizardCompleted", "true");
      router.push("/paziente/richieste-prescrizione/nuova");
    } else if (method === "photo") {
      // Vai alla pagina di upload talloncino
      localStorage.setItem("terapieWizardCompleted", "true");
      router.push("/paziente/terapie/nuova?mode=photo");
    }
  };

  const handleFarmacoSelect = (farmaco: Farmaco) => {
    setSelectedFarmaco(farmaco);
    // Pre-compila posologia se disponibile
    if (farmaco.dosaggio && !formData.posologia) {
      setFormData({
        ...formData,
        posologia: `${farmaco.dosaggio} ${farmaco.formaFarmaceutica || ""}`.trim(),
      });
    }
  };

  const handleAddOrario = () => {
    setOrari([...orari, ""]);
  };

  const handleRemoveOrario = (index: number) => {
    const newOrari = orari.filter((_, i) => i !== index);
    setOrari(newOrari);
  };

  const handleOrarioChange = (index: number, value: string) => {
    const newOrari = [...orari];
    newOrari[index] = value;
    setOrari(newOrari);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex-1 h-2 rounded-full mx-1 transition-all duration-500 ${
                  index <= currentStep
                    ? "bg-gradient-to-r " + step.color
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <div className="text-center text-sm text-gray-600">
            Step {currentStep + 1} di {steps.length}
          </div>
        </div>

        {/* Main Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 shadow-2xl border-0">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-r ${currentStepData.color} flex items-center justify-center shadow-lg`}
                >
                  <Icon className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-center mb-2">
                {currentStepData.title}
              </h1>
              <p className="text-gray-600 text-center mb-8">
                {currentStepData.subtitle}
              </p>

              {/* Step Content */}
              <div className="space-y-4">
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-bold text-red-900 mb-1">
                            ⚠️ Configurazione Obbligatoria
                          </h3>
                          <p className="text-sm text-red-700">
                            Per utilizzare il sistema di prescrizioni e ordini, devi prima configurare almeno una terapia. Questo ci permette di gestire correttamente i tuoi farmaci e le notifiche.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-blue-900 mb-1">
                            Gestione Intelligente
                          </h3>
                          <p className="text-sm text-blue-700">
                            Tieni traccia di tutte le tue terapie e non dimenticare mai una dose
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-purple-900 mb-1">
                            Promemoria Automatici
                          </h3>
                          <p className="text-sm text-purple-700">
                            Ricevi notifiche quando è ora di prendere i tuoi farmaci
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-green-900 mb-1">
                            Rinnovi Semplificati
                          </h3>
                          <p className="text-sm text-green-700">
                            Ti avvisiamo quando è il momento di rinnovare le prescrizioni
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-center text-gray-700 mb-6 font-medium">
                      Scegli il metodo più comodo per configurare la tua prima terapia:
                    </p>

                    <div className="grid grid-cols-1 gap-4">
                      <Button
                        onClick={() => handleMethodSelect("manual")}
                        size="lg"
                        className="h-auto py-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-6 h-6" />
                          <span className="text-lg font-semibold">Cerca nel Catalogo</span>
                          <span className="text-xs opacity-90">Trova il farmaco e inserisci i dettagli</span>
                        </div>
                      </Button>

                      <Button
                        onClick={() => handleMethodSelect("photo")}
                        size="lg"
                        variant="outline"
                        className="h-auto py-6 border-2"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-6 h-6" />
                          <span className="text-lg font-semibold">Carica Foto Talloncino</span>
                          <span className="text-xs opacity-70">Scansiona automaticamente i dati</span>
                        </div>
                      </Button>

                      <Button
                        onClick={() => handleMethodSelect("prescription")}
                        size="lg"
                        variant="outline"
                        className="h-auto py-6 border-2"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Heart className="w-6 h-6" />
                          <span className="text-lg font-semibold">Richiedi Prescrizione</span>
                          <span className="text-xs opacity-70">Il medico configurerà la terapia</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-center text-gray-700 mb-4 font-medium">
                      Cerca il farmaco nel catalogo nazionale
                    </p>

                    <div className="space-y-4">
                      <DrugSearch
                        onSelect={handleFarmacoSelect}
                        placeholder="Digita il nome del farmaco (es. Lodoz, Aspirina...)"
                        className="w-full"
                      />

                      {selectedFarmaco && (
                        <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-lg">
                                  {selectedFarmaco.nomeCommerciale}
                                </p>
                                {selectedFarmaco.ricettaRichiesta ? (
                                  <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                                    Richiede Ricetta
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                                    OTC
                                  </span>
                                )}
                              </div>
                              {selectedFarmaco.dosaggio && (
                                <p className="text-sm text-gray-600 mb-1">
                                  Dosaggio: {selectedFarmaco.dosaggio}
                                </p>
                              )}
                              {selectedFarmaco.principioAttivo && (
                                <p className="text-sm text-gray-500">
                                  {selectedFarmaco.principioAttivo}
                                </p>
                              )}
                              {selectedFarmaco.formaFarmaceutica && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {selectedFarmaco.formaFarmaceutica}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFarmaco(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 3 && selectedFarmaco && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Farmaco selezionato: {selectedFarmaco.nomeCommerciale}
                      </p>
                      <p className="text-xs text-blue-700">
                        Compila i dettagli della terapia
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="posologia">Posologia *</Label>
                        <Input
                          id="posologia"
                          placeholder="Es. 1 compressa al mattino"
                          value={formData.posologia}
                          onChange={(e) => setFormData({ ...formData, posologia: e.target.value })}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Come e quando assumere il farmaco
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="doseGiornaliera">Dose Giornaliera (compresse/giorno) *</Label>
                        <Input
                          id="doseGiornaliera"
                          type="number"
                          step="0.1"
                          min="0.1"
                          placeholder="1"
                          value={formData.doseGiornaliera}
                          onChange={(e) => setFormData({ ...formData, doseGiornaliera: parseFloat(e.target.value) || 1 })}
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="numeroScatole">Numero Scatole</Label>
                          <Input
                            id="numeroScatole"
                            type="number"
                            min="1"
                            placeholder="1"
                            value={formData.numeroScatole}
                            onChange={(e) => setFormData({ ...formData, numeroScatole: parseInt(e.target.value, 10) || 1 })}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="compressePerScatola">Compresse per Scatola</Label>
                          <Input
                            id="compressePerScatola"
                            type="number"
                            min="1"
                            placeholder="30"
                            value={formData.compressePerScatola}
                            onChange={(e) => setFormData({ ...formData, compressePerScatola: parseInt(e.target.value, 10) || 30 })}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Orari Assunzione *</Label>
                        <div className="space-y-2 mt-2">
                          {orari.map((orario, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                type="time"
                                value={orario}
                                onChange={(e) => handleOrarioChange(index, e.target.value)}
                                className="flex-1"
                              />
                              {orari.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveOrario(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddOrario}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Aggiungi Orario
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 border rounded-lg">
                        <input
                          type="checkbox"
                          id="conPasto"
                          checked={formData.conPasto}
                          onChange={(e) => setFormData({ ...formData, conPasto: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <div>
                          <Label htmlFor="conPasto" className="cursor-pointer">
                            Assunzione con Pasto
                          </Label>
                          <p className="text-xs text-gray-500">
                            Il farmaco deve essere assunto durante i pasti
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="note">Note (opzionale)</Label>
                        <textarea
                          id="note"
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                          placeholder="Note aggiuntive sulla terapia..."
                          value={formData.note}
                          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 text-center">
                      <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-green-900 mb-2">
                        Sistema Inizializzato! 🎉
                      </h3>
                      <p className="text-green-700 mb-4">
                        Hai configurato la tua prima terapia. Ora puoi:
                      </p>
                      <ul className="text-left text-sm text-green-700 space-y-2">
                        <li>✅ Richiedere prescrizioni al medico</li>
                        <li>✅ Ordinare farmaci in farmacia</li>
                        <li>✅ Ricevere promemoria automatici</li>
                        <li>✅ Gestire rinnovi e scadenze</li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <Pill className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-blue-900">Terapie</p>
                        <p className="text-xs text-blue-700">Gestisci i tuoi farmaci</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-purple-900">Calendario</p>
                        <p className="text-xs text-purple-700">Visualizza le assunzioni</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                  onClick={handleBack}
                  variant="ghost"
                  disabled={currentStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Indietro
                </Button>

                {currentStep < 4 && (
                  <div className="text-sm text-gray-500 italic">
                    Configurazione obbligatoria
                  </div>
                )}

                <Button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 2 && !selectedFarmaco) ||
                    (currentStep === 3 && createMutation.isPending) ||
                    currentStep === 4
                  }
                  className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {currentStep === 3 && createMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creazione...
                    </>
                  ) : currentStep === steps.length - 1 ? (
                    "Vai alla Dashboard"
                  ) : (
                    <>
                      Avanti
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
