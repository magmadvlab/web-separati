'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { STATI_BADGE } from '@/lib/status-badges';



interface Richiesta {
  id: number;
  pazienteId: number;
  paziente?: {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale?: string;
    telefono?: string;
  };
  dataRichiesta: string;
  oraInizio: string;
  durata: number;
  modalita: string;
  motivoVisita: string;
  note?: string;
  urgente: boolean;
  stato: string;
  motivoRifiuto?: string;
  dataRisposta?: string;
  appuntamento?: {
    id: number;
    stato: string;
  };
}

const MODALITA_LABEL: Record<string, string> = {
  ambulatorio: 'Ambulatorio',
  presenza: 'In Presenza',
  domicilio: 'Domicilio',
  online: 'Online',
  videochiamata: 'Videochiamata',
};

export default function RichiesteAppuntamentoPage() {
  const router = useRouter();
  const [richieste, setRichieste] = useState<Richiesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStato, setFiltroStato] = useState<string>('');
  const [selectedRichiesta, setSelectedRichiesta] = useState<Richiesta | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'conferma' | 'rifiuta' | 'riprogramma' | 'annulla' | 'completa' | null>(null);
  const [noteAction, setNoteAction] = useState('');
  const [nuovaData, setNuovaData] = useState('');
  const [nuovaOra, setNuovaOra] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRichieste();
  }, [filtroStato]);

  const loadRichieste = async () => {
    try {
      setLoading(true);
      const params = filtroStato ? `?stato=${filtroStato}` : '';
      const res = await api.get(`/professionista/richieste-appuntamento${params}`);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setRichieste(data);
    } catch (error) {
      console.error('Errore:', error);
      setRichieste([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRichiesta || !actionType) return;

    try {
      setSubmitting(true);
      let url = '';
      let body: any = {};

      switch (actionType) {
        case 'conferma':
          url = `/professionista/richieste-appuntamento/${selectedRichiesta.id}/conferma`;
          body = { note: noteAction || undefined };
          break;
        case 'rifiuta':
          url = `/professionista/richieste-appuntamento/${selectedRichiesta.id}/rifiuta`;
          body = { motivo: noteAction };
          break;
        case 'riprogramma':
          if (!nuovaData || !nuovaOra) {
            alert('Seleziona nuova data e orario');
            return;
          }
          url = `/professionista/richieste-appuntamento/${selectedRichiesta.id}/riprogramma`;
          body = { nuovaData, nuovaOra, motivo: noteAction || undefined };
          break;
        case 'annulla':
          url = `/professionista/richieste-appuntamento/${selectedRichiesta.id}/annulla`;
          body = { motivo: noteAction || 'Annullata dal professionista per imprevisto' };
          break;
        case 'completa':
          url = `/professionista/appuntamenti/${selectedRichiesta.appuntamento?.id || selectedRichiesta.id}/completa`;
          body = { noteCompletamento: noteAction || undefined };
          break;
      }

      await api.post(url, body);
      closeModal();
      loadRichieste();
    } catch (error: any) {
      console.error('Errore:', error);
      alert(error.response?.data?.message || "Errore durante l'operazione");
    } finally {
      setSubmitting(false);
    }
  };

  const openActionModal = (richiesta: Richiesta, action: 'conferma' | 'rifiuta' | 'riprogramma' | 'annulla' | 'completa') => {
    setSelectedRichiesta(richiesta);
    setActionType(action);
    setNoteAction('');
    setNuovaData(richiesta.dataRichiesta ? new Date(richiesta.dataRichiesta).toISOString().slice(0, 10) : '');
    setNuovaOra(formatTime(richiesta.oraInizio));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRichiesta(null);
    setActionType(null);
    setNoteAction('');
    setNuovaData('');
    setNuovaOra('');
  };

  const formatTime = (val: string) => {
    if (!val) return '';
    if (val.includes('T')) {
      const d = new Date(val);
      return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    }
    return val.substring(0, 5);
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Richieste Appuntamento</h1>
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
              onClick={() => setFiltroStato('in_attesa')}
              className={`px-4 py-2 rounded-lg ${
                filtroStato === 'in_attesa'
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
              onClick={() => setFiltroStato('rifiutata')}
              className={`px-4 py-2 rounded-lg ${
                filtroStato === 'rifiutata'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rifiutate
            </button>
          </div>
        </div>

        {/* Lista Richieste */}
        {richieste.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Nessuna richiesta trovata</p>
          </div>
        ) : (
          <div className="space-y-4">
            {richieste.map((richiesta) => {
              const badge = STATI_BADGE[richiesta.stato] || STATI_BADGE.in_attesa;
              const pazNome = richiesta.paziente
                ? `${richiesta.paziente.nome} ${richiesta.paziente.cognome}`
                : `Paziente #${richiesta.pazienteId}`;
              const prenotante =
                (richiesta as any).richiedenteNome ||
                (richiesta as any).prenotatoDaNome ||
                (richiesta as any).utentePrenotante?.nome;
              return (
                <div key={richiesta.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{pazNome}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                        {richiesta.urgente && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Urgente
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          Data:{' '}
                          {new Date(richiesta.dataRichiesta).toLocaleDateString('it-IT', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                        <div>Orario: {formatTime(richiesta.oraInizio)}</div>
                        <div>Durata: {richiesta.durata} minuti</div>
                        <div>
                          Modalita: {MODALITA_LABEL[richiesta.modalita] || richiesta.modalita}
                        </div>
                        {prenotante && <div>Prenotato da: {prenotante}</div>}
                        {richiesta.paziente?.telefono && (
                          <div>Tel: {richiesta.paziente.telefono}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Motivo Visita:</h4>
                    <p className="text-gray-700">{richiesta.motivoVisita}</p>
                    {richiesta.note && (
                      <>
                        <h4 className="font-medium text-gray-900 mt-3 mb-2">Note Paziente:</h4>
                        <p className="text-gray-700 italic">{richiesta.note}</p>
                      </>
                    )}
                    {richiesta.motivoRifiuto && (
                      <>
                        <h4 className="font-medium text-gray-900 mt-3 mb-2">Motivo Rifiuto:</h4>
                        <p className="text-gray-700">{richiesta.motivoRifiuto}</p>
                      </>
                    )}
                  </div>

                  {/* Azioni */}
                  <div className="flex gap-3">
                    {richiesta.stato === 'in_attesa' && (
                      <>
                        <button
                          onClick={() => openActionModal(richiesta, 'conferma')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Conferma
                        </button>
                        <button
                          onClick={() => openActionModal(richiesta, 'rifiuta')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Rifiuta
                        </button>
                        <button
                          onClick={() => openActionModal(richiesta, 'riprogramma')}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                        >
                          Riprogramma
                        </button>
                        <button
                          onClick={() => openActionModal(richiesta, 'annulla')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Annulla
                        </button>
                      </>
                    )}
                    {richiesta.stato === 'confermata' && (
                      <>
                        <button
                          onClick={() => openActionModal(richiesta, 'riprogramma')}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                        >
                          Riprogramma
                        </button>
                        <button
                          onClick={() => openActionModal(richiesta, 'completa')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Marca Completata
                        </button>
                        <button
                          onClick={() => openActionModal(richiesta, 'annulla')}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          Annulla
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/professionista/calendario')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Torna al Calendario
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
              {actionType === 'riprogramma' && 'Riprogramma Richiesta'}
              {actionType === 'annulla' && 'Annulla Richiesta'}
              {actionType === 'completa' && 'Completa Appuntamento'}
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="font-medium">
                {selectedRichiesta.paziente
                  ? `${selectedRichiesta.paziente.nome} ${selectedRichiesta.paziente.cognome}`
                  : `Paziente #${selectedRichiesta.pazienteId}`}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {new Date(selectedRichiesta.dataRichiesta).toLocaleDateString('it-IT')} -{' '}
                {formatTime(selectedRichiesta.oraInizio)}
              </div>
            </div>

            {actionType === 'riprogramma' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nuova Data</label>
                  <input
                    type="date"
                    value={nuovaData}
                    onChange={(e) => setNuovaData(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nuovo Orario</label>
                  <input
                    type="time"
                    value={nuovaOra}
                    onChange={(e) => setNuovaOra(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'conferma' && 'Note Conferma (opzionale)'}
                {actionType === 'rifiuta' && 'Motivo Rifiuto (richiesto)'}
                {actionType === 'riprogramma' && 'Motivo riprogrammazione (opzionale)'}
                {actionType === 'annulla' && 'Motivo annullamento (opzionale)'}
                {actionType === 'completa' && 'Note Completamento (opzionale)'}
              </label>
              <textarea
                value={noteAction}
                onChange={(e) => setNoteAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                placeholder={
                  actionType === 'rifiuta'
                    ? 'Specifica il motivo del rifiuto...'
                    : actionType === 'riprogramma'
                    ? 'Aggiungi una nota sulla modifica...'
                    : actionType === 'annulla'
                    ? "Aggiungi il motivo dell'annullamento..."
                    : 'Aggiungi note...'
                }
                required={actionType === 'rifiuta'}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleAction}
                disabled={
                  submitting ||
                  (actionType === 'rifiuta' && !noteAction.trim()) ||
                  (actionType === 'riprogramma' && (!nuovaData || !nuovaOra))
                }
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  actionType === 'conferma'
                    ? 'bg-green-600 hover:bg-green-700'
                    : actionType === 'rifiuta'
                    ? 'bg-red-600 hover:bg-red-700'
                    : actionType === 'riprogramma'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : actionType === 'annulla'
                    ? 'bg-gray-600 hover:bg-gray-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {submitting ? 'Invio...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
