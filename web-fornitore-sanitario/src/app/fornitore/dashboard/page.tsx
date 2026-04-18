"use client";

import { useAuthStore } from "@/stores/auth-store";
import { Package, TrendingUp, Clock, CheckCircle, Shield } from "lucide-react";

export default function FornitoreDashboard() {
  const { user } = useAuthStore();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard Fornitore
        </h1>
        <p className="text-gray-600 mt-2">
          Benvenuto, {user?.username || "Fornitore"}
        </p>
      </div>

      {/* WEB-10: Alert dati sanitari sensibili */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm">
        <Shield className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-orange-900">Dati sanitari sensibili &mdash; GDPR Art. 9</p>
          <p className="text-orange-800 mt-0.5">
            Gli ordini di ossigeno, ausili e presidi sanitari rivelano condizioni croniche degli assistiti.
            Questi dati sono accessibili <strong>esclusivamente al personale autorizzato</strong> e non possono essere condivisi o usati per finalità diverse dall&#39;evasione dell&#39;ordine.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ordini Attivi</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Lavorazione</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completati</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fatturato Mese</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">€0</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-colors text-left">
            <Package className="w-8 h-8 text-cyan-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Gestisci Ordini</h3>
            <p className="text-sm text-gray-600 mt-1">Visualizza e gestisci gli ordini</p>
          </button>

          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-colors text-left">
            <TrendingUp className="w-8 h-8 text-cyan-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Contratti</h3>
            <p className="text-sm text-gray-600 mt-1">Gestisci i contratti attivi</p>
          </button>

          <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-colors text-left">
            <CheckCircle className="w-8 h-8 text-cyan-600 mb-2" />
            <h3 className="font-semibold text-gray-900">Monitoraggio</h3>
            <p className="text-sm text-gray-600 mt-1">Monitora le consegne</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Attività Recente</h2>
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nessuna attività recente</p>
        </div>
      </div>
    </div>
  );
}
