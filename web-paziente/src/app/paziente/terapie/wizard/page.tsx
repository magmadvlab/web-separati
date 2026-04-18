"use client";

import { useEffect, useState } from "react";
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

interface MedicoFamiglia {
  id: number;
  nome: string;
  cognome: string;
  tipoMedico?: string;
  specializzazione?: string;
  indirizzoStudio?: string;
  citta?: string;
  telefono?: string;
  distanzaKm?: number | null;
}

interface MinoreACarico {
  id: number;
  nome: string;
  cognome: string;
  dataNascita: string;
  codiceFiscale: string;
  pediatraId?: number | null;
  pediatra?: MedicoFamiglia | null;
}

export default function WizardTerapiePage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [selectedFarmaco, setSelectedFarmaco] = useState<Farmaco | null>(null);
  const [orari, setOrari] = useState<string[]>([""]);
  const [setupLoading, setSetupLoading] = useState(false);
  const [savingFamilySetup, setSavingFamilySetup] = useState(false);
  const [medicoCurante, setMedicoCurante] = useState<MedicoFamiglia | null>(null);
  const [mediciDisponibili, setMediciDisponibili] = useState<MedicoFamiglia[]>([]);
  const [pediatriDisponibili, setPediatriDisponibili] = useState<MedicoFamiglia[]>([]);
  const [hasChildren, setHasChildren] = useState(false);
  const [minori, setMinori] = useState<MinoreACarico[]>([]);
  const [selectedMedicoId, setSelectedMedicoId] = useState<number | null>(null);
  const [selectedPediatraByMinore, setSelectedPediatraByMinore] = useState<Record<number, number>>({});
  const [newMinore, setNewMinore] = useState({
    nome: "",
    cognome: "",
    dataNascita: "",
    codiceFiscale: "",
    sesso: "",
    note: "",
  });
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
      title: "Famiglia e Medici di Fiducia",
      subtitle: "Assegna medico curante e pediatra dei minori",
      icon: Shield,
      color: "from-indigo-500 to-blue-500",
    },
    {
      id: 2,
      title: "Come vuoi iniziare?",
      subtitle: "Scegli il metodo più comodo per te",
      icon: Heart,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: 3,
      title: "Cerca il Farmaco",
      subtitle: "Trova il farmaco nel catalogo",
      icon: Search,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 4,
      title: "Dettagli Terapia",
      subtitle: "Inserisci posologia e orari",
      icon: Pill,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: 5,
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
      setCurrentStep(5);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error?.response?.data?.message || error?.message || "Errore durante la creazione",
        variant: "destructive",
      });
    },
  });

  const normalizeArray = <T = any,>(value: any): T[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
    return [];
  };

  const toIsoDate = (value?: string | Date | null) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  const getAge = (value?: string | Date | null) => {
    if (!value) return null;
    const birthDate = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(birthDate.getTime())) return null;
    const diff = Date.now() - birthDate.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
  };

  const loadFamilySetup = async () => {
    setSetupLoading(true);
    try {
      const medicoPromise = api.get("/paziente/medico-curante");
      const mediciPromise = api.get("/paziente/medico-curante/medici-disponibili");
      const pediatriPromise = api.get("/paziente/medico-curante/medici-disponibili", {
        params: { tipoMedico: "pediatra" },
      });
      const minoriPrimaryPromise = api.get("/paziente/medico-curante/minori-a-carico");

      const [medicoResult, mediciResult, pediatriResult, minoriPrimaryResult] =
        await Promise.allSettled([medicoPromise, mediciPromise, pediatriPromise, minoriPrimaryPromise]);

      if (medicoResult.status === "fulfilled") {
        setMedicoCurante((medicoResult.value.data as MedicoFamiglia) || null);
      } else {
        setMedicoCurante(null);
      }

      if (mediciResult.status === "fulfilled") {
        const lista = normalizeArray<MedicoFamiglia>(mediciResult.value.data).filter(
          (m) => m.tipoMedico !== "pediatra"
        );
        setMediciDisponibili(lista);
        setSelectedMedicoId((prev) => prev || lista[0]?.id || null);
      } else {
        setMediciDisponibili([]);
      }

      if (pediatriResult.status === "fulfilled") {
        setPediatriDisponibili(normalizeArray<MedicoFamiglia>(pediatriResult.value.data));
      } else {
        setPediatriDisponibili([]);
      }

      if (minoriPrimaryResult.status === "fulfilled") {
        const minoriData = normalizeArray<MinoreACarico>(minoriPrimaryResult.value.data);
        setMinori(minoriData);
        setHasChildren(minoriData.length > 0);
        setSelectedPediatraByMinore(
          minoriData.reduce<Record<number, number>>((acc, minore) => {
            if (minore.pediatraId) acc[minore.id] = minore.pediatraId;
            return acc;
          }, {})
        );
      } else {
        try {
          const minoriFallback = await api.get("/paziente/medico-curante/minori");
          const minoriData = normalizeArray<MinoreACarico>(minoriFallback.data);
          setMinori(minoriData);
          setHasChildren(minoriData.length > 0);
          setSelectedPediatraByMinore(
            minoriData.reduce<Record<number, number>>((acc, minore) => {
              if (minore.pediatraId) acc[minore.id] = minore.pediatraId;
              return acc;
            }, {})
          );
        } catch {
          setMinori([]);
          setHasChildren(false);
        }
      }
    } finally {
      setSetupLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 1) {
      void loadFamilySetup();
    }
  }, [currentStep]);

  const assegnaMedicoCurante = async () => {
    if (medicoCurante || !selectedMedicoId) return;

    await api.post("/paziente/medico-curante/prima-scelta", {
      medicoId: selectedMedicoId,
    });

    toast({
      title: "Medico assegnato",
      description: "Medico di famiglia associato correttamente.",
    });
  };

  const addMinore = async () => {
    if (
      !newMinore.nome.trim() ||
      !newMinore.cognome.trim() ||
      !newMinore.dataNascita ||
      !newMinore.codiceFiscale.trim()
    ) {
      toast({
        title: "Dati incompleti",
        description: "Compila nome, cognome, data di nascita e codice fiscale del minore.",
        variant: "destructive",
      });
      return;
    }

    setSavingFamilySetup(true);
    try {
      await api.post("/paziente/medico-curante/minori", {
        nome: newMinore.nome.trim(),
        cognome: newMinore.cognome.trim(),
        dataNascita: newMinore.dataNascita,
        codiceFiscale: newMinore.codiceFiscale.trim().toUpperCase(),
        sesso: newMinore.sesso || undefined,
        note: newMinore.note || undefined,
      });

      setNewMinore({
        nome: "",
        cognome: "",
        dataNascita: "",
        codiceFiscale: "",
        sesso: "",
        note: "",
      });

      await loadFamilySetup();
      toast({
        title: "Minore aggiunto",
        description: "Ora seleziona il pediatra di famiglia.",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description:
          error?.response?.data?.message || "Impossibile aggiungere il minore in questo momento.",
        variant: "destructive",
      });
    } finally {
      setSavingFamilySetup(false);
    }
  };

  const assegnaPediatra = async (minoreId: number, pediatraId?: number) => {
    const pediatraTarget = pediatraId || selectedPediatraByMinore[minoreId];
    if (!pediatraTarget) {
      toast({
        title: "Pediatra mancante",
        description: "Seleziona un pediatra prima di confermare.",
        variant: "destructive",
      });
      return;
    }

    await api.post(`/paziente/medico-curante/minori/${minoreId}/pediatra`, {
      pediatraId: pediatraTarget,
    });
  };

  const ensureFamilySetupBeforeNext = async () => {
    setSavingFamilySetup(true);
    try {
      if (!medicoCurante && !selectedMedicoId) {
        toast({
          title: "Medico di famiglia mancante",
          description: "Seleziona il tuo medico curante per continuare.",
          variant: "destructive",
        });
        return false;
      }

      if (!medicoCurante && selectedMedicoId) {
        await assegnaMedicoCurante();
      }

      if (hasChildren) {
        if (minori.length === 0) {
          toast({
            title: "Minori non inseriti",
            description: "Hai indicato minori a carico: aggiungine almeno uno.",
            variant: "destructive",
          });
          return false;
        }

        for (const minore of minori) {
          if (!minore.pediatraId) {
            const selectedPediatra = selectedPediatraByMinore[minore.id];
            if (!selectedPediatra) {
              toast({
                title: "Pediatra mancante",
                description: `Seleziona il pediatra per ${minore.nome} ${minore.cognome}.`,
                variant: "destructive",
              });
              return false;
            }
            await assegnaPediatra(minore.id, selectedPediatra);
          }
        }
      }

      await loadFamilySetup();
      return true;
    } catch (error: any) {
      toast({
        title: "Errore configurazione",
        description:
          error?.response?.data?.message || "Impossibile completare la configurazione famiglia.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSavingFamilySetup(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      if (currentStep === 1) {
        const ok = await ensureFamilySetupBeforeNext();
        if (!ok) return;
      }

      if (currentStep === 3 && !selectedFarmaco) {
        toast({
          title: "Attenzione",
          description: "Seleziona un farmaco prima di continuare",
          variant: "destructive",
        });
        return;
      }

      if (currentStep === 4) {
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

        createMutation.mutate();
        return;
      }

      setCurrentStep(currentStep + 1);
    } else {
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
      setCurrentStep(3);
    } else if (method === "prescription") {
      localStorage.setItem("terapieWizardCompleted", "true");
      router.push("/paziente/richieste-prescrizione/nuova");
    } else if (method === "photo") {
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
                  <div className="space-y-6">
                    {setupLoading ? (
                      <div className="text-center py-10 text-gray-600">Caricamento dati famiglia...</div>
                    ) : (
                      <>
                        <div className="border rounded-lg p-4 bg-slate-50">
                          <h3 className="font-semibold mb-3">1) Medico di famiglia</h3>
                          {medicoCurante ? (
                            <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                              <p className="font-medium text-green-900">
                                Assegnato: Dott. {medicoCurante.nome} {medicoCurante.cognome}
                              </p>
                              <p className="text-green-700">
                                {medicoCurante.specializzazione || "Medicina Generale"}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm text-gray-700">
                                Seleziona il tuo medico curante per iniziare.
                              </p>
                              <select
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={selectedMedicoId ?? ""}
                                onChange={(e) => setSelectedMedicoId(Number(e.target.value) || null)}
                              >
                                <option value="">Seleziona medico di famiglia</option>
                                {mediciDisponibili.map((medico) => (
                                  <option key={medico.id} value={medico.id}>
                                    Dott. {medico.nome} {medico.cognome}
                                    {medico.citta ? ` · ${medico.citta}` : ""}
                                  </option>
                                ))}
                              </select>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={!selectedMedicoId || savingFamilySetup}
                                onClick={async () => {
                                  setSavingFamilySetup(true);
                                  try {
                                    await assegnaMedicoCurante();
                                    await loadFamilySetup();
                                  } catch (error: any) {
                                    toast({
                                      title: "Errore",
                                      description:
                                        error?.response?.data?.message ||
                                        "Impossibile assegnare il medico curante.",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setSavingFamilySetup(false);
                                  }
                                }}
                              >
                                Assegna medico curante
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="border rounded-lg p-4 bg-slate-50">
                          <h3 className="font-semibold mb-3">2) Minori a carico e pediatra</h3>
                          <p className="text-sm text-gray-700 mb-3">
                            Hai minori a carico per cui vuoi gestire visite pediatriche?
                          </p>
                          <div className="flex gap-2 mb-4">
                            <Button
                              type="button"
                              variant={hasChildren ? "default" : "outline"}
                              onClick={() => setHasChildren(true)}
                            >
                              Sì
                            </Button>
                            <Button
                              type="button"
                              variant={!hasChildren ? "default" : "outline"}
                              onClick={() => setHasChildren(false)}
                            >
                              No
                            </Button>
                          </div>

                          {hasChildren && (
                            <div className="space-y-4">
                              <div className="border rounded p-3 bg-white">
                                <p className="text-sm font-medium mb-2">Aggiungi minore</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Nome"
                                    value={newMinore.nome}
                                    onChange={(e) =>
                                      setNewMinore({ ...newMinore, nome: e.target.value })
                                    }
                                  />
                                  <Input
                                    placeholder="Cognome"
                                    value={newMinore.cognome}
                                    onChange={(e) =>
                                      setNewMinore({ ...newMinore, cognome: e.target.value })
                                    }
                                  />
                                  <Input
                                    type="date"
                                    value={newMinore.dataNascita}
                                    onChange={(e) =>
                                      setNewMinore({ ...newMinore, dataNascita: e.target.value })
                                    }
                                  />
                                  <Input
                                    placeholder="Codice fiscale"
                                    maxLength={16}
                                    value={newMinore.codiceFiscale}
                                    onChange={(e) =>
                                      setNewMinore({
                                        ...newMinore,
                                        codiceFiscale: e.target.value.toUpperCase(),
                                      })
                                    }
                                  />
                                </div>
                                <Button
                                  type="button"
                                  className="mt-3"
                                  variant="outline"
                                  onClick={addMinore}
                                  disabled={savingFamilySetup}
                                >
                                  Aggiungi minore
                                </Button>
                              </div>

                              {minori.length > 0 ? (
                                minori.map((minore) => (
                                  <div key={minore.id} className="border rounded p-3 bg-white space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium">
                                          {minore.nome} {minore.cognome}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Età: {getAge(minore.dataNascita) ?? "-"} anni
                                        </p>
                                      </div>
                                      {minore.pediatra ? (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                          Pediatra assegnato
                                        </span>
                                      ) : (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                          Da assegnare
                                        </span>
                                      )}
                                    </div>

                                    {minore.pediatra ? (
                                      <p className="text-sm text-green-800">
                                        Dott. {minore.pediatra.nome} {minore.pediatra.cognome}
                                      </p>
                                    ) : (
                                      <div className="flex flex-col md:flex-row gap-2">
                                        <select
                                          className="flex-1 border rounded px-3 py-2 text-sm"
                                          value={selectedPediatraByMinore[minore.id] || ""}
                                          onChange={(e) =>
                                            setSelectedPediatraByMinore((prev) => ({
                                              ...prev,
                                              [minore.id]: Number(e.target.value) || 0,
                                            }))
                                          }
                                        >
                                          <option value="">Seleziona pediatra</option>
                                          {pediatriDisponibili.map((pediatra) => (
                                            <option key={pediatra.id} value={pediatra.id}>
                                              Dott. {pediatra.nome} {pediatra.cognome}
                                            </option>
                                          ))}
                                        </select>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          disabled={!selectedPediatraByMinore[minore.id] || savingFamilySetup}
                                          onClick={async () => {
                                            setSavingFamilySetup(true);
                                            try {
                                              await assegnaPediatra(
                                                minore.id,
                                                selectedPediatraByMinore[minore.id]
                                              );
                                              await loadFamilySetup();
                                              toast({
                                                title: "Pediatra assegnato",
                                                description: `${minore.nome} ${minore.cognome} ora ha il pediatra di famiglia.`,
                                              });
                                            } catch (error: any) {
                                              toast({
                                                title: "Errore",
                                                description:
                                                  error?.response?.data?.message ||
                                                  "Impossibile assegnare il pediatra.",
                                                variant: "destructive",
                                              });
                                            } finally {
                                              setSavingFamilySetup(false);
                                            }
                                          }}
                                        >
                                          Conferma pediatra
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-gray-600">
                                  Nessun minore inserito. Aggiungine almeno uno se hai selezionato "Sì".
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-500">
                          Premi <strong>Avanti</strong> per validare e salvare in automatico la configurazione.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {currentStep === 2 && (
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

                {currentStep === 3 && (
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

                {currentStep === 4 && selectedFarmaco && (
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

                {currentStep === 5 && (
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

                {currentStep < 5 && (
                  <div className="text-sm text-gray-500 italic">
                    Configurazione obbligatoria
                  </div>
                )}

                <Button
                  onClick={handleNext}
                  disabled={
                    setupLoading ||
                    savingFamilySetup ||
                    (currentStep === 3 && !selectedFarmaco) ||
                    (currentStep === 4 && createMutation.isPending) ||
                    currentStep === 5
                  }
                  className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {currentStep === 4 && createMutation.isPending ? (
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
