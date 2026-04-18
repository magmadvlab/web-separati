'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Specialista {
  id: number;
  nome: string;
  cognome: string;
  specializzazione: string;
  macroArea?: string;
  email: string;
  telefono?: string;
  indirizzoStudio?: string;
  citta?: string;
  stato: string;
}

export default function SpecialistiPage() {
  const router = useRouter();
  const [specialisti, setSpecialisti] = useState<Specialista[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSpecializzazione, setFiltroSpecializzazione] = useState('');

  useEffect(() => {
    loadSpecialisti();
  }, []);

  const loadSpecialisti = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/specialista/permessi', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        // Estrai gli specialisti dai permessi
        const specialistiList = data.map((p: any) => p.specialista);
        setSpecialisti(specialistiList);
      }
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const specializzazioni = Array.from(
    new Set(specialisti.map((s) => s.specializzazione))
  ).sort();

  const specialistiFiltered = specialisti.filter((s) => {
    const matchSearch =
      searchTerm === '' ||
      s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.specializzazione.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSpecializzazione =
      filtroSpecializzazione === '' || s.specializzazione === filtroSpecializzazione;

    return matchSearch && matchSpecializzazione;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">I Miei Specialisti</h1>
          <p className="mt-2 text-gray-600">
            Specialisti con cui hai già un collegamento attivo
          </p>
        </div>

        {/* Ricerca e Filtri */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cerca Specialista
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, cognome o specializzazione..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtra per Specializzazione
              </label>
              <select
                value={filtroSpecializzazione}
                onChange={(e) => setFiltroSpecializzazione(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutte le specializzazioni</option>
                {specializzazioni.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista Specialisti */}
        {specialistiFiltered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">👨‍⚕️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessuno specialista trovato
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filtroSpecializzazione
                ? 'Prova a modificare i filtri di ricerca'
                : 'Non hai ancora specialisti collegati. Richiedi un consulto per iniziare.'}
            </p>
            <button
              onClick={() => router.push('/paziente/ricerca-servizi')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Cerca Specialisti
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {specialistiFiltered.map((specialista) => (
              <div
                key={specialista.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dott. {specialista.nome} {specialista.cognome}
                    </h3>
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      {specialista.specializzazione}
                    </p>
                    {specialista.macroArea && (
                      <p className="text-xs text-gray-500 mt-1">{specialista.macroArea}</p>
                    )}
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                    👨‍⚕️
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {specialista.indirizzoStudio && (
                    <div className="flex items-start gap-2">
                      <span>📍</span>
                      <span>
                        {specialista.indirizzoStudio}
                        {specialista.citta && `, ${specialista.citta}`}
                      </span>
                    </div>
                  )}
                  {specialista.telefono && (
                    <div className="flex items-center gap-2">
                      <span>📞</span>
                      <span>{specialista.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span>✉️</span>
                    <span className="truncate">{specialista.email}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      router.push(`/paziente/specialisti/${specialista.id}/calendario`)
                    }
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    📅 Prenota
                  </button>
                  <button
                    onClick={() => router.push(`/paziente/consulti?specialista=${specialista.id}`)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    📋 Consulti
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Link Mie Richieste */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/paziente/consulti')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Vedi Mie Richieste Consulto →
          </button>
        </div>
      </div>
    </div>
  );
}
