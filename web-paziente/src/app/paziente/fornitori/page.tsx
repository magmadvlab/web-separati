'use client';

import { useState, useEffect } from 'react';
import { Search, Package, Building2, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Fornitore {
  id: number;
  ragioneSociale: string;
  tipoFornitore: string;
  categorieProdotti: string[];
  indirizzo: string;
  citta: string;
  provincia: string;
  telefono?: string;
  email?: string;
  valutazioneMedia?: number;
  numeroRecensioni?: number;
  stato: string;
}

export default function FornitoriPage() {
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFornitore, setTipoFornitore] = useState('');

  useEffect(() => {
    fetchFornitori();
  }, []);

  const fetchFornitori = async () => {
    try {
      const response = await fetch('/api/fornitori');
      if (response.ok) {
        const data = await response.json();
        setFornitori(data);
      }
    } catch (error) {
      console.error('Errore caricamento fornitori:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFornitori = fornitori.filter(f => {
    const matchQuery = !searchQuery || 
      f.ragioneSociale.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tipoFornitore.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTipo = !tipoFornitore || f.tipoFornitore === tipoFornitore;
    return matchQuery && matchTipo && f.stato === 'attivo';
  });

  const tipiFornitori = Array.from(new Set(fornitori.map(f => f.tipoFornitore)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento fornitori...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Fornitori Sanitari
          </h1>
          <p className="text-gray-600">
            Gestisci contratti di fornitura continua per dispositivi medici e prodotti sanitari
          </p>
        </div>

        {/* Link ai contratti */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">I Miei Contratti</h3>
                <p className="text-sm text-gray-600">Visualizza e gestisci i tuoi contratti attivi</p>
              </div>
            </div>
            <Link
              href="/paziente/contratti"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Vai ai Contratti
            </Link>
          </div>
        </div>

        {/* Filtri */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cerca Fornitore
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nome fornitore o tipo prodotto..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Fornitore
              </label>
              <select
                value={tipoFornitore}
                onChange={(e) => setTipoFornitore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tutti</option>
                {tipiFornitori.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista Fornitori */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFornitori.map((fornitore) => (
            <div
              key={fornitore.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">
                  {fornitore.tipoFornitore}
                </span>
                <Building2 className="h-6 w-6 text-gray-400" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {fornitore.ragioneSociale}
              </h3>

              {fornitore.categorieProdotti && fornitore.categorieProdotti.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Prodotti:</p>
                  <div className="flex flex-wrap gap-2">
                    {fornitore.categorieProdotti.slice(0, 3).map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                      >
                        {cat}
                      </span>
                    ))}
                    {fornitore.categorieProdotti.length > 3 && (
                      <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                        +{fornitore.categorieProdotti.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600 mb-4">
                <p>{fornitore.citta}, {fornitore.provincia}</p>
              </div>

              {fornitore.valutazioneMedia && (
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm font-medium">{fornitore.valutazioneMedia.toFixed(1)}</span>
                  {fornitore.numeroRecensioni && (
                    <span className="text-sm text-gray-500">({fornitore.numeroRecensioni})</span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/paziente/fornitori/${fornitore.id}`}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 text-center text-sm font-medium"
                >
                  Dettagli
                </Link>
                <Link
                  href={`/paziente/contratti/nuovo?fornitoreId=${fornitore.id}`}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-center text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Package className="h-4 w-4" />
                  Attiva Contratto
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filteredFornitori.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessun fornitore trovato
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
