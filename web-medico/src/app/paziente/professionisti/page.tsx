'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Calendar, Phone } from 'lucide-react';
import Link from 'next/link';

interface Professionista {
  id: number;
  nome: string;
  cognome: string;
  tipoProfessionista: string;
  specializzazioni: string[];
  indirizzo: string;
  citta: string;
  provincia: string;
  telefono?: string;
  email?: string;
  valutazioneMedia?: number;
  numeroRecensioni?: number;
  tariffaBase?: number;
  accettaSSN?: boolean;
  disponibile: boolean;
}

export default function ProfessionistiPage() {
  const [professionisti, setProfessionisti] = useState<Professionista[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoProfessionista, setTipoProfessionista] = useState('');

  useEffect(() => {
    fetchProfessionisti();
  }, []);

  const fetchProfessionisti = async () => {
    try {
      const response = await fetch('/api/professionisti');
      if (response.ok) {
        const data = await response.json();
        setProfessionisti(data);
      }
    } catch (error) {
      console.error('Errore caricamento professionisti:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfessionisti = professionisti.filter(p => {
    const matchQuery = !searchQuery || 
      `${p.nome} ${p.cognome}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tipoProfessionista.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTipo = !tipoProfessionista || p.tipoProfessionista === tipoProfessionista;
    return matchQuery && matchTipo;
  });

  const tipiProfessionista = Array.from(new Set(professionisti.map(p => p.tipoProfessionista)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento professionisti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Professionisti Sanitari
          </h1>
          <p className="text-gray-600">
            Trova fisioterapisti, psicologi, infermieri e altri professionisti sanitari
          </p>
        </div>

        {/* Filtri */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cerca
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nome o tipo professionista..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Professionista
              </label>
              <select
                value={tipoProfessionista}
                onChange={(e) => setTipoProfessionista(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti</option>
                {tipiProfessionista.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista Professionisti */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessionisti.map((prof) => (
            <Link
              key={prof.id}
              href={`/paziente/professionisti/${prof.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                  {prof.tipoProfessionista}
                </span>
                {prof.disponibile && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Disponibile
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {prof.nome} {prof.cognome}
              </h3>

              {prof.specializzazioni && prof.specializzazioni.length > 0 && (
                <p className="text-sm text-gray-600 mb-3">
                  {prof.specializzazioni.join(', ')}
                </p>
              )}

              {prof.valutazioneMedia && (
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{prof.valutazioneMedia.toFixed(1)}</span>
                  {prof.numeroRecensioni && (
                    <span className="text-sm text-gray-500">({prof.numeroRecensioni})</span>
                  )}
                </div>
              )}

              <div className="flex items-start gap-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-600">
                  <p>{prof.indirizzo}</p>
                  <p>{prof.citta}, {prof.provincia}</p>
                </div>
              </div>

              {prof.telefono && (
                <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{prof.telefono}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                {prof.tariffaBase && (
                  <span className="text-lg font-semibold text-gray-900">
                    €{prof.tariffaBase}
                  </span>
                )}
                {prof.accettaSSN && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Accetta SSN
                  </span>
                )}
              </div>

              <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                Prenota Appuntamento
              </button>
            </Link>
          ))}
        </div>

        {filteredProfessionisti.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessun professionista trovato
            </h3>
            <p className="text-gray-600">
              Prova a modificare i filtri di ricerca
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
