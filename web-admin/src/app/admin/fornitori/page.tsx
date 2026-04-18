'use client';

import { useState, useEffect } from 'react';
import { Search, Building2, Eye, Edit, Trash2, CheckCircle, XCircle, Package } from 'lucide-react';
import api from '@/lib/api';

interface Fornitore {
  id: number;
  ragioneSociale: string;
  partitaIva: string;
  email: string;
  telefono?: string;
  tipoFornitore: string;
  indirizzo?: string;
  citta: string;
  provincia: string;
  cap?: string;
  categorieProdotti: string[];
  valutazioneMedia?: number;
  numeroRecensioni?: number;
  attivo: boolean;
  createdAt: string;
}

export default function AdminFornitoriPage() {
  const [fornitori, setFornitori] = useState<Fornitore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAttivo, setFilterAttivo] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');

  useEffect(() => {
    fetchFornitori();
  }, []);

  const fetchFornitori = async () => {
    try {
      const response = await api.get('/fornitori');
      setFornitori(response.data);
    } catch (error) {
      console.error('Errore caricamento fornitori:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttivo = async (id: number, attivo: boolean) => {
    try {
      await api.put(`/fornitori/${id}`, { attivo: !attivo });
      fetchFornitori();
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
    }
  };

  const deleteFornitore = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo fornitore?')) return;
    
    try {
      await api.delete(`/fornitori/${id}`);
      fetchFornitori();
    } catch (error) {
      console.error('Errore eliminazione fornitore:', error);
    }
  };

  const tipiFornitore = Array.from(new Set(fornitori.map(f => f.tipoFornitore)));

  const filteredFornitori = fornitori.filter(f => {
    const matchQuery = !searchQuery || 
      f.ragioneSociale.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.partitaIva.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tipoFornitore.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchAttivo = filterAttivo === 'all' || 
      (filterAttivo === 'attivi' && f.attivo) ||
      (filterAttivo === 'non_attivi' && !f.attivo);
    
    const matchTipo = filterTipo === 'all' || f.tipoFornitore === filterTipo;
    
    return matchQuery && matchAttivo && matchTipo;
  });

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestione Fornitori Sanitari
          </h1>
          <p className="text-gray-600">
            Gestisci fornitori, verifica documenti e monitora contratti
          </p>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale</p>
                <p className="text-2xl font-bold text-gray-900">{fornitori.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attivi</p>
                <p className="text-2xl font-bold text-green-600">
                  {fornitori.filter(f => f.attivo).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Non Attivi</p>
                <p className="text-2xl font-bold text-red-600">
                  {fornitori.filter(f => !f.attivo).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rating Medio</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {fornitori.length > 0 
                    ? (fornitori.reduce((acc, f) => acc + (Number(f.valutazioneMedia) || 0), 0) / fornitori.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <Package className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Filtri */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  placeholder="Ragione sociale, P.IVA o email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo Fornitore
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutti i tipi</option>
                {tipiFornitore.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stato
              </label>
              <select
                value={filterAttivo}
                onChange={(e) => setFilterAttivo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutti</option>
                <option value="attivi">Attivi</option>
                <option value="non_attivi">Non Attivi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabella */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fornitore
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contatti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Località
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prodotti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFornitori.map((forn) => (
                  <tr key={forn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {forn.ragioneSociale}
                        </div>
                        <div className="text-sm text-gray-500">
                          P.IVA: {forn.partitaIva}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                        {forn.tipoFornitore}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{forn.email}</div>
                      {forn.telefono && (
                        <div className="text-sm text-gray-500">{forn.telefono}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{forn.citta}</div>
                      <div className="text-sm text-gray-500">{forn.provincia}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {forn.categorieProdotti.slice(0, 2).map((cat, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {cat}
                          </span>
                        ))}
                        {forn.categorieProdotti.length > 2 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            +{forn.categorieProdotti.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {forn.valutazioneMedia ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {Number(forn.valutazioneMedia).toFixed(1)} ⭐
                          </div>
                          <div className="text-sm text-gray-500">
                            {forn.numeroRecensioni} recensioni
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Nessuna</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleAttivo(forn.id, forn.attivo)}
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          forn.attivo
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {forn.attivo ? 'Attivo' : 'Non Attivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.location.href = `/admin/fornitori/${forn.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizza"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => window.location.href = `/admin/fornitori/${forn.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Modifica"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteFornitore(forn.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Elimina"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredFornitori.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nessun fornitore trovato</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
