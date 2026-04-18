"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { PlanCard } from "@/components/onboarding/PlanCard";
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Heart,
  Stethoscope,
  Building2,
  PartyPopper
} from "lucide-react";

type PlanType = 'freemium' | 'crediti' | 'mensile' | 'annuale';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Step 2: Piano
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('freemium');

  // Step 3: Medico
  const [citta, setCitta] = useState('');
  const [selectedMedico, setSelectedMedico] = useState<number | null>(null);

  // Step 4: Farmacia
  const [selectedFarmacia, setSelectedFarmacia] = useState<number | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const totalSteps = 5;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Salva dati onboarding via API
      await api.put('/paziente/profilo', {
        abbonamentoTipo: selectedPlan,
        medicoCuranteId: selectedMedico,
        farmaciaPreferitaId: selectedFarmacia,
      });

      toast({
        title: "Onboarding completato! 🎉",
        description: "Benvenuto su RicettaZero!",
      });
      
      // Redirect alla dashboard - il wizard terapie si avvierà automaticamente
      router.push("/paziente/dashboard");
    } catch (error: any) {
      toast({
        title: "Errore",
        description: error?.message || "Errore durante il salvataggio",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <ProgressBar currentStep={step} totalSteps={totalSteps} />
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Benvenuto su RicettaZero
          </CardTitle>
          <CardDescription>
            Completa il tuo profilo in pochi semplici passaggi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Benvenuto */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center mx-auto">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Ciao! 👋
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Siamo felici di averti con noi. Configuriamo insieme il tuo profilo per offrirti 
                  la migliore esperienza possibile. Ci vorranno solo 2-3 minuti.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                    <Heart className="h-5 w-5 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Scegli il tuo piano</h4>
                  <p className="text-sm text-gray-600">Inizia gratis o scegli un abbonamento</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                    <Stethoscope className="h-5 w-5 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Scegli medico e farmacia</h4>
                  <p className="text-sm text-gray-600">Personalizza le tue preferenze</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <Sparkles className="h-5 w-5 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">Configura le terapie</h4>
                  <p className="text-sm text-gray-600">Gestisci i tuoi farmaci facilmente</p>
                </div>
              </div>
              <Button onClick={handleNext} size="lg" className="w-full md:w-auto">
                Inizia
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Scegli Piano */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Scegli il tuo piano
                </h3>
                <p className="text-gray-600">
                  Inizia gratis e passa a un piano a pagamento quando vuoi
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PlanCard
                  name="Freemium"
                  price="€0"
                  period="Sempre gratis"
                  features={[
                    "Prescrizioni digitali",
                    "Ritiro in farmacia",
                    "Gestione terapie",
                  ]}
                  selected={selectedPlan === 'freemium'}
                  onSelect={() => setSelectedPlan('freemium')}
                />
                <PlanCard
                  name="Crediti"
                  price="€20"
                  period="10 consegne"
                  badge="POPOLARE"
                  badgeColor="blue"
                  features={[
                    "Tutto del Freemium",
                    "10 consegne a domicilio",
                    "€2 per consegna",
                    "Crediti non scadono",
                  ]}
                  selected={selectedPlan === 'crediti'}
                  onSelect={() => setSelectedPlan('crediti')}
                />
                <PlanCard
                  name="Mensile"
                  price="€9.99"
                  period="al mese"
                  features={[
                    "Tutto del Freemium",
                    "Consegne illimitate",
                    "Priorità nelle consegne",
                    "Supporto prioritario",
                  ]}
                  selected={selectedPlan === 'mensile'}
                  onSelect={() => setSelectedPlan('mensile')}
                />
                <PlanCard
                  name="Annuale"
                  price="€99"
                  period="all'anno (€8.25/mese)"
                  badge="RISPARMIA 17%"
                  badgeColor="yellow"
                  features={[
                    "Tutto del Mensile",
                    "Risparmio di €20/anno",
                    "Servizi veterinari scontati",
                    "Accesso anticipato",
                  ]}
                  selected={selectedPlan === 'annuale'}
                  onSelect={() => setSelectedPlan('annuale')}
                  gradient
                />
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Indietro
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Medico Curante */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Scegli il tuo medico curante
                </h3>
                <p className="text-gray-600">
                  Seleziona il medico che ti seguirà (puoi cambiarlo in seguito)
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="citta">Città</Label>
                  <Input
                    id="citta"
                    value={citta}
                    onChange={(e) => setCitta(e.target.value)}
                    placeholder="Es: Roma"
                  />
                </div>

                {/* TODO: Lista medici disponibili */}
                <div className="p-8 bg-gray-50 rounded-lg text-center">
                  <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {citta 
                      ? `Cerca medici disponibili a ${citta}...` 
                      : 'Inserisci la tua città per vedere i medici disponibili'
                    }
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Funzionalità in arrivo
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Indietro
                </Button>
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Salta per ora
                </Button>
                <Button onClick={handleNext} className="flex-1" disabled={!selectedMedico}>
                  Continua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Farmacia Preferita */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Scegli la tua farmacia preferita
                </h3>
                <p className="text-gray-600">
                  Seleziona la farmacia più comoda per te (puoi cambiarla in seguito)
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="citta-farmacia">Città</Label>
                  <Input
                    id="citta-farmacia"
                    value={citta}
                    onChange={(e) => setCitta(e.target.value)}
                    placeholder="Es: Roma"
                  />
                </div>

                {/* TODO: Lista farmacie disponibili */}
                <div className="p-8 bg-gray-50 rounded-lg text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {citta 
                      ? `Cerca farmacie disponibili a ${citta}...` 
                      : 'Inserisci la tua città per vedere le farmacie disponibili'
                    }
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Funzionalità in arrivo
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Indietro
                </Button>
                <Button variant="outline" onClick={handleSkip} className="flex-1">
                  Salta per ora
                </Button>
                <Button onClick={handleNext} className="flex-1" disabled={!selectedFarmacia}>
                  Continua
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Completa */}
          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto">
                <PartyPopper className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Tutto pronto! 🎉
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Il tuo profilo è stato configurato con successo. Sei pronto per iniziare a usare RicettaZero.
                </p>
              </div>

              {/* Riepilogo */}
              <div className="bg-gray-50 rounded-lg p-6 text-left space-y-4">
                <h4 className="font-semibold text-gray-900">Riepilogo delle tue scelte:</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Piano selezionato</p>
                      <p className="text-sm text-gray-600 capitalize">{selectedPlan}</p>
                    </div>
                  </div>

                  {selectedMedico && (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Medico curante</p>
                        <p className="text-sm text-gray-600">Selezionato</p>
                      </div>
                    </div>
                  )}

                  {selectedFarmacia && (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Farmacia preferita</p>
                        <p className="text-sm text-gray-600">Selezionata</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CTA Wizard Terapie */}
              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                  <h4 className="font-semibold text-lg">Prossimo passo</h4>
                </div>
                <p className="text-gray-700 mb-4">
                  Configura le tue terapie attuali per ricevere promemoria automatici 
                  e gestire i rinnovi delle prescrizioni
                </p>
                <Link href="/paziente/terapie/wizard">
                  <Button size="lg" className="w-full mb-2">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Configura le tue terapie
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => router.push("/paziente/dashboard")}
                >
                  Salta per ora (potrai farlo dopo)
                </Button>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Indietro
                </Button>
                <Button 
                  onClick={handleComplete} 
                  disabled={isSubmitting}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                >
                  {isSubmitting ? "Completamento..." : "Vai alla Dashboard"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
