'use client';

import { useState, useEffect } from 'react';
import { Search, UserCheck, UserX, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

interface Professionista {
  id: number;
  nome: string;
  cognome: string;
  tipoProfessionista: string;
  email: string;
  telefono?: string;
  citta: string;
  provincia: string;
  numeroAlbo?: string;
  valutazioneMedia?: number;
  numeroRecensioni?: number;
  disponibile: boolean;
  createdAt: string;
}

export default function AdminProfessionistiPage() {
  const [professionisti, setProfessionisti] = useState<Professionista[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDisponibile, setFilterDisponibile] = useState<string>('all');

  useEffect(() => {
    fetchProfessionisti();
  }, []);

  const fetchProfessionisti = async () => {
    try {
      const response = await api.get('/professionisti');
      setProfessionisti(response.data);
    } catch (error) {
      console.error('Errore caricamento professionisti:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDisponibilita = async (id: number, disponibile: boolean) => {
    try {
      await api.put(`/professionisti/${id}`, { disponibile: !disponibile });
      fetchProfessionisti();
    } catch (error) {
      console.error('Errore aggiornamento disponibilità:', error);
    }
  };

  const deleteProfessionista = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo professionista?')) return;
    
    try {
      await api.delete(`/professionisti/${id}`);
      fetchProfessionisti();
    } catch (error) {
      console.error('Errore eliminazione professionista:', error);
    }
  };

  const filteredProfessionisti = professionisti.filter(p => {
    const matchQuery = !searchQuery || 
      `${p.nome} ${p.cognome}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tipoProfessionista.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchDisponibile = filterDisponibile === 'all' || 
      (filterDisponibile === 'disponibili' && p.disponibile) ||
      (filterDisponibile === 'non_disponibili' && !p.disponibile);
    
    return matchQuery && matchDisponibile;
  });

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestione Professionisti Sanitari
          </h1>
          <p className="text-gray-600">
            Gestisci professionisti, verifica documenti e monitora attività
          </p>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale</p>
                <p className="text-2xl font-bold text-gray-900">{professionisti.length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponibili</p>
                <p className="text-2xl font-bold text-green-600">
                  {professionisti.filter(p => p.disponibile).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Non Disponibili</p>
                <p className="text-2xl font-bold text-red-600">
                  {professionisti.filter(p => !p.disponibile).length}
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
                  {(professionisti.reduce((acc, p) => acc + (Number(p.valutazioneMedia) || 0), 0) / professionisti.length).toFixed(1)}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
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
                  placeholder="Nome, tipo o email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stato
              </label>
              <select
                value={filterDisponibile}
                onChange={(e) => setFilterDisponibile(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutti</option>
                <option value="disponibili">Disponibili</option>
                <option value="non_disponibili">Non Disponibili</option>
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
                    Professionista
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
                {filteredProfessionisti.map((prof) => (
                  <tr key={prof.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {prof.nome} {prof.cognome}
                        </div>
                        {prof.numeroAlbo && (
                          <div className="text-sm text-gray-500">
                            Albo: {prof.numeroAlbo}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                        {prof.tipoProfessionista}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{prof.email}</div>
                      {prof.telefono && (
                        <div className="text-sm text-gray-500">{prof.telefono}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{prof.citta}</div>
                      <div className="text-sm text-gray-500">{prof.provincia}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {prof.valutazioneMedia ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {Number(prof.valutazioneMedia).toFixed(1)} ⭐
                          </div>
                          <div className="text-sm text-gray-500">
                            {prof.numeroRecensioni} recensioni
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Nessuna</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleDisponibilita(prof.id, prof.disponibile)}
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          prof.disponibile
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {prof.disponibile ? 'Disponibile' : 'Non Disponibile'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.location.href = `/admin/professionisti/${prof.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizza"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => window.location.href = `/admin/professionisti/${prof.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Modifica"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteProfessionista(prof.id)}
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

          {filteredProfessionisti.length === 0 && (
            <div className="text-center py-12">
              <UserX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nessun professionista trovato</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
