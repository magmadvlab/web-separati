'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Richiesta {
  id: number;
  paziente: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale: string;
    telefono?: string;
    emailPersonale?: string;
  };
  dataRichiesta: string;
  oraInizio: string;
  oraFine: string;
  motivo: string;
  tipoVisita: string;
  priorita: string;
  notePaziente?: string;
  noteSpecialista?: string;
  stato: string;
  dataConferma?: string;
  dataRifiuto?: string;
  motivoRifiuto?: string;
}

const STATI_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Attesa' },
  confermata: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confermata' },
  rifiutata: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rifiutata' },
  completata: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completata' },
  cancellata: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancellata' },
  non_presentato: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Non Presentato' },
};

export default function RichiesteConsultoPage() {
  const router = useRouter();
  const [richieste, setRichieste] = useState<Richiesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStato, setFiltroStato] = useState<string>('');
  const [selectedRichiesta, setSelectedRichiesta] = useState<Richiesta | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'conferma' | 'rifiuta' | 'completa' | null>(null);
  const [noteAction, setNoteAction] = useState('');

  useEffect(() => {
    loadRichieste();
  }, [filtroStato]);

  const loadRichieste = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filtroStato
        ? `/api/specialista/calendario/richieste?stato=${filtroStato}`
        : '/api/specialista/calendario/richieste';

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setRichieste(data);
      }
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRichiesta || !actionType) return;

    try {
      const token = localStorage.getItem('token');
      let url = '';
      let body: any = {};

      switch (actionType) {
        case 'conferma':
          url = `/api/specialista/calendario/richieste/${selectedRichiesta.id}/conferma`;
          body = { noteConferma: noteAction };
          break;
        case 'rifiuta':
          url = `/api/specialista/calendario/richieste/${selectedRichiesta.id}/rifiuta`;
          body = { motivoRifiuto: noteAction };
          break;
        case 'completa':
          url = `/api/specialista/calendario/richieste/${selectedRichiesta.id}/completa`;
          body = { noteSpecialista: noteAction };
          break;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowModal(false);
        setSelectedRichiesta(null);
        setActionType(null);
        setNoteAction('');
        loadRichieste();
      } else {
        const error = await res.json();
        alert(error.message || 'Errore durante l\'operazione');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante l\'operazione');
    }
  };

  const openActionModal = (richiesta: Richiesta, action: 'conferma' | 'rifiuta' | 'completa') => {
    setSelectedRichiesta(richiesta);
    setActionType(action);
    setShowModal(true);
  };

  const richiesteFiltered = richieste;

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
          <h1 className="text-3xl font-bold text-gray-900">Richieste Consulto</h1>
          <p className="mt-2 text-gray-600">Gestisci le richieste di appuntamento dai pazienti</p>
        </div>

        {/* Filtri */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroStato('')}
              className={`px-4 py-2 rounded-lg ${
                filtroStato === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutte
            </button>
            <button
              onClick={() => setFiltroStato('pendente')}
              className={`px-4 py-2 rounded-lg ${
                filtroStato === 'pendente'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Attesa
            </button>
            <button
              onClick={() => setFiltroStato('confermata')}
              className={`px-4 py-2 rounded-lg ${
                filtroStato === 'confermata'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confermate
            </button>
            <button
              onClick={() => setFiltroStato('completata')}
              className={`px-4 py-2 rounded-lg ${
                filtroStato === 'completata'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completate
            </button>
          </div>
        </div>

        {/* Lista Richieste */}
        {richiesteFiltered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nessuna richiesta trovata</p>
          </div>
        ) : (
          <div className="space-y-4">
            {richiesteFiltered.map((richiesta) => {
              const badge = STATI_BADGE[richiesta.stato] || STATI_BADGE.pendente;
              return (
                <div key={richiesta.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {richiesta.paziente.nome} {richiesta.paziente.cognome}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                        {richiesta.priorita === 'urgente' && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            🚨 Urgente
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>📅 {new Date(richiesta.dataRichiesta).toLocaleDateString('it-IT', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}</div>
                        <div>🕐 {richiesta.oraInizio} - {richiesta.oraFine}</div>
                        <div>📋 Tipo: {richiesta.tipoVisita}</div>
                        {richiesta.paziente.telefono && (
                          <div>📞 {richiesta.paziente.telefono}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Motivo Consulto:</h4>
                    <p className="text-gray-700">{richiesta.motivo}</p>
                    {richiesta.notePaziente && (
                      <>
                        <h4 className="font-medium text-gray-900 mt-3 mb-2">Note Paziente:</h4>
                        <p className="text-gray-700 italic">{richiesta.notePaziente}</p>
                      </>
                    )}
                    {richiesta.noteSpecialista && (
                      <>
                        <h4 className="font-medium text-gray-900 mt-3 mb-2">Tue Note:</h4>
                        <p className="text-gray-700">{richiesta.noteSpecialista}</p>
                      </>
                    )}
                  </div>

                  {/* Azioni */}
                  <div className="flex gap-3">
                    {richiesta.stato === 'pendente' && (
                      <>
                        <button
                          onClick={() => openActionModal(richiesta, 'conferma')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          ✓ Conferma
                        </button>
                        <button
                          onClick={() => openActionModal(richiesta, 'rifiuta')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          ✗ Rifiuta
                        </button>
                      </>
                    )}
                    {richiesta.stato === 'confermata' && (
                      <button
                        onClick={() => openActionModal(richiesta, 'completa')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        ✓ Marca Completata
                      </button>
                    )}
                    {richiesta.stato === 'confermata' && (
                      <button
                        onClick={() => router.push(`/specialista/pazienti/${richiesta.paziente.id}`)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        📋 Cartella Clinica
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Link Calendario */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/specialista/calendario')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            ← Torna al Calendario
          </button>
        </div>
      </div>

      {/* Modal Azione */}
      {showModal && selectedRichiesta && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {actionType === 'conferma' && 'Conferma Richiesta'}
              {actionType === 'rifiuta' && 'Rifiuta Richiesta'}
              {actionType === 'completa' && 'Completa Visita'}
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="font-medium">
                {selectedRichiesta.paziente.nome} {selectedRichiesta.paziente.cognome}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {new Date(selectedRichiesta.dataRichiesta).toLocaleDateString('it-IT')} •{' '}
                {selectedRichiesta.oraInizio}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'conferma' && 'Note Conferma (opzionale)'}
                {actionType === 'rifiuta' && 'Motivo Rifiuto (richiesto)'}
                {actionType === 'completa' && 'Note Visita (opzionale)'}
              </label>
              <textarea
                value={noteAction}
                onChange={(e) => setNoteAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                placeholder={
                  actionType === 'rifiuta'
                    ? 'Specifica il motivo del rifiuto...'
                    : 'Aggiungi note...'
                }
                required={actionType === 'rifiuta'}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRichiesta(null);
                  setActionType(null);
                  setNoteAction('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleAction}
                disabled={actionType === 'rifiuta' && !noteAction.trim()}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  actionType === 'conferma'
                    ? 'bg-green-600 hover:bg-green-700'
                    : actionType === 'rifiuta'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
