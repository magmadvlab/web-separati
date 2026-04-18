"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";
import { User, Stethoscope, Building2, Truck, UserCog, FlaskConical, Shield, Users, Package, Check, Heart, PawPrint } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on role
      if (user.ruolo === "paziente") {
        router.push("/paziente/dashboard");
      } else if (user.ruolo === "medico") {
        router.push("/medico/dashboard");
      } else if (user.ruolo === "specialista") {
        router.push("/specialista/dashboard");
      } else if (user.ruolo === "farmacista") {
        router.push("/farmacia/dashboard");
      } else if (user.ruolo === "rider") {
        router.push("/delivery/dashboard");
      } else if (user.ruolo === "admin") {
        router.push("/admin/dashboard");
      }
    }
  }, [isAuthenticated, user, router]);

  // Se già autenticato, mostra loading
  if (isAuthenticated && user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">RicettaZero</h1>
          <p className="mt-4 text-gray-600">Reindirizzamento...</p>
        </div>
      </div>
    );
  }

  // Landing page con portali separati
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">RicettaZero</h1>
            </div>
            <Link 
              href="/login"
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Accedi
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-4">
          Sistema Digitale per la Sanità
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Gestione prescrizioni mediche, ordini farmaci e consegne a domicilio in un'unica piattaforma integrata
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-300 text-lg">
              Inizia Gratis
            </button>
          </Link>
          <Link href="/onboarding">
            <button className="px-8 py-4 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-300 text-lg">
              Prova Onboarding
            </button>
          </Link>
        </div>
      </section>

      {/* Per Te e Per i Tuoi Animali */}
      <section className="container mx-auto px-4 pb-16">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Per Te e Per i Tuoi Animali
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Servizi per Te */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-8 border-2 border-blue-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Servizi per Te</h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Prescrizioni mediche digitali</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Ordini farmaci con consegna a domicilio</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Gestione terapie croniche automatica</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Prenotazione visite specialistiche</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Esami di laboratorio e referti online</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Servizi Veterinari */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-8 border-2 border-green-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full -mr-16 -mt-16 opacity-50"></div>
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4">
                <PawPrint className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Servizi Veterinari</h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Visite veterinarie a domicilio</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Vaccinazioni e richiami programmati</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Prescrizioni farmaci veterinari</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Cartella clinica digitale per animali</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Consulti veterinari online</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Piani e Abbonamenti */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-4 text-gray-900">
            Piani e Abbonamenti
          </h3>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Scegli il piano più adatto alle tue esigenze. Inizia gratis e passa a un piano a pagamento quando vuoi.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Piano Freemium */}
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-2 border-gray-200">
              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Freemium</h4>
                <div className="text-4xl font-bold text-gray-900 mb-1">€0</div>
                <p className="text-sm text-gray-600">Sempre gratis</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Prescrizioni digitali</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Ritiro in farmacia</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Gestione terapie</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-400">
                  <span className="w-4 h-4 mt-0.5">✗</span>
                  <span>Consegna a domicilio</span>
                </li>
              </ul>
              <Link href="/register">
                <button className="w-full py-2 px-4 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                  Inizia Gratis
                </button>
              </Link>
            </div>

            {/* Piano Crediti */}
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-2 border-blue-300">
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPOLARE
              </div>
              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Crediti</h4>
                <div className="text-4xl font-bold text-blue-600 mb-1">€20</div>
                <p className="text-sm text-gray-600">10 consegne</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Tutto del piano Freemium</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>10 consegne a domicilio</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>€2 per consegna</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Crediti non scadono</span>
                </li>
              </ul>
              <Link href="/register">
                <button className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                  Acquista Crediti
                </button>
              </Link>
            </div>

            {/* Piano Mensile */}
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg border-2 border-purple-300">
              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Mensile</h4>
                <div className="text-4xl font-bold text-purple-600 mb-1">€9.99</div>
                <p className="text-sm text-gray-600">al mese</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Tutto del piano Freemium</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Consegne illimitate</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Priorità nelle consegne</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Supporto prioritario</span>
                </li>
              </ul>
              <Link href="/register">
                <button className="w-full py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors">
                  Abbonati Ora
                </button>
              </Link>
            </div>

            {/* Piano Annuale */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-6 shadow-lg border-2 border-green-400 text-white">
              <div className="absolute top-0 right-0 bg-yellow-400 text-green-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
                RISPARMIA 17%
              </div>
              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold mb-2">Annuale</h4>
                <div className="text-4xl font-bold mb-1">€99</div>
                <p className="text-sm text-green-100">all'anno (€8.25/mese)</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span>Tutto del piano Mensile</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span>Risparmio di €20/anno</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span>Servizi veterinari scontati</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                  <span>Accesso anticipato nuove funzioni</span>
                </li>
              </ul>
              <Link href="/register">
                <button className="w-full py-2 px-4 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors">
                  Abbonati Ora
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Portali */}
      <section className="container mx-auto px-4 pb-20">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Scegli il tuo portale
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Portale Paziente */}
          <Link href="/login?role=paziente">
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-blue-500 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                  <User className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Paziente</h4>
                <p className="text-gray-600 mb-4">
                  Gestisci le tue prescrizioni, ordina farmaci e monitora le tue terapie
                </p>
                <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform">
                  Accedi al portale
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Portale Medico */}
          <Link href="/login?role=medico">
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-green-500 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
                  <Stethoscope className="w-8 h-8 text-green-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Medico</h4>
                <p className="text-gray-600 mb-4">
                  Gestisci i tuoi pazienti, crea prescrizioni e monitora le terapie
                </p>
                <div className="flex items-center text-green-600 font-medium group-hover:translate-x-2 transition-transform">
                  Accedi al portale
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Portale Farmacia */}
          <Link href="/login?role=farmacista">
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-purple-500 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-500 transition-colors">
                  <Building2 className="w-8 h-8 text-purple-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Farmacia</h4>
                <p className="text-gray-600 mb-4">
                  Gestisci ordini, catalogo farmaci e preparazione consegne
                </p>
                <div className="flex items-center text-purple-600 font-medium group-hover:translate-x-2 transition-transform">
                  Accedi al portale
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Portale Delivery */}
          <Link href="/login?role=rider">
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-orange-500 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4 group-hover:bg-orange-500 transition-colors">
                  <Truck className="w-8 h-8 text-orange-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Delivery</h4>
                <p className="text-gray-600 mb-4">
                  Gestisci le consegne, ottimizza i percorsi e traccia gli ordini
                </p>
                <div className="flex items-center text-orange-600 font-medium group-hover:translate-x-2 transition-transform">
                  Accedi al portale
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Portale Specialista */}
          <Link href="/login?role=specialista">
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-teal-500 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4 group-hover:bg-teal-500 transition-colors">
                  <UserCog className="w-8 h-8 text-teal-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Specialista</h4>
                <p className="text-gray-600 mb-4">
                  Gestisci consulti specialistici e visite programmate
                </p>
                <div className="flex items-center text-teal-600 font-medium group-hover:translate-x-2 transition-transform">
                  Accedi al portale
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Portale Laboratorio */}
          <Link href="/login?role=laboratorio">
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-pink-500 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-4 group-hover:bg-pink-500 transition-colors">
                  <FlaskConical className="w-8 h-8 text-pink-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Laboratorio</h4>
                <p className="text-gray-600 mb-4">
                  Gestisci prenotazioni esami e referti di laboratorio
                </p>
                <div className="flex items-center text-pink-600 font-medium group-hover:translate-x-2 transition-transform">
                  Accedi al portale
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Portale Admin */}
          <Link href="/login?role=admin">
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-red-500 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 group-hover:bg-red-500 transition-colors">
                  <Shield className="w-8 h-8 text-red-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Admin</h4>
                <p className="text-gray-600 mb-4">
                  Gestisci sistema, utenti e configurazioni avanzate
                </p>
                <div className="flex items-center text-red-600 font-medium group-hover:translate-x-2 transition-transform">
                  Accedi al portale
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Portale Professionisti Sanitari */}
          <Link href="/paziente/professionisti">
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-500 transition-colors">
                  <Users className="w-8 h-8 text-indigo-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Professionisti</h4>
                <p className="text-gray-600 mb-4">
                  Cerca e prenota professionisti sanitari qualificati
                </p>
                <div className="flex items-center text-indigo-600 font-medium group-hover:translate-x-2 transition-transform">
                  Esplora servizi
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Portale Fornitori Sanitari */}
          <Link href="/paziente/fornitori">
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-cyan-500 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-100 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center mb-4 group-hover:bg-cyan-500 transition-colors">
                  <Package className="w-8 h-8 text-cyan-600 group-hover:text-white transition-colors" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Fornitori</h4>
                <p className="text-gray-600 mb-4">
                  Scopri fornitori sanitari e dispositivi medici certificati
                </p>
                <div className="flex items-center text-cyan-600 font-medium group-hover:translate-x-2 transition-transform">
                  Esplora catalogo
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h5 className="font-bold text-lg mb-2">Sicuro e Certificato</h5>
              <p className="text-gray-600 text-sm">Conforme alle normative sanitarie italiane</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h5 className="font-bold text-lg mb-2">Veloce e Efficiente</h5>
              <p className="text-gray-600 text-sm">Prescrizioni digitali in tempo reale</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h5 className="font-bold text-lg mb-2">Disponibile 24/7</h5>
              <p className="text-gray-600 text-sm">Accesso sempre disponibile da qualsiasi dispositivo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>&copy; 2026 RicettaZero. Sistema dimostrativo per la gestione digitale delle prescrizioni mediche.</p>
        </div>
      </footer>
    </div>
  );
}
