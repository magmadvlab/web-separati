'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Richiesta {
  id: number;
  specialista: {
    id: number;
    nome: string;
    cognome: string;
    specializzazione: string;
    telefono?: string;
    indirizzoStudio?: string;
    citta?: string;
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
  createdAt: string;
}

const STATI_BADGE: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'In Attesa', icon: '⏳' },
  confermata: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confermata', icon: '✓' },
  rifiutata: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rifiutata', icon: '✗' },
  completata: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completata', icon: '✓' },
  cancellata: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancellata', icon: '✗' },
  non_presentato: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Non Presentato', icon: '⚠' },
};

export default function ConsultiPazientePage() {
  return (
    <Suspense fallback={<ConsultiPazienteFallback />}>
      <ConsultiPazientePageContent />
    </Suspense>
  );
}

function ConsultiPazienteFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Caricamento...</p>
      </div>
    </div>
  );
}

function ConsultiPazientePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const specialistaIdFilter = searchParams.get('specialista');

  const [richieste, setRichieste] = useState<Richiesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStato, setFiltroStato] = useState<string>('');

  useEffect(() => {
    loadRichieste();
  }, [filtroStato]);

  const loadRichieste = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filtroStato
        ? `/api/paziente/consulti?stato=${filtroStato}`
        : '/api/paziente/consulti';

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

  const handleCancellaRichiesta = async (richiestaId: number) => {
    if (!confirm('Sei sicuro di voler cancellare questa richiesta?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/paziente/consulti/${richiestaId}/cancella`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ motivo: 'Cancellata dal paziente' }),
      });

      if (res.ok) {
        loadRichieste();
      } else {
        const error = await res.json();
        alert(error.message || 'Errore durante la cancellazione');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante la cancellazione');
    }
  };

  const richiesteFiltered = specialistaIdFilter
    ? richieste.filter((r) => r.specialista.id === parseInt(specialistaIdFilter))
    : richieste;

  if (loading) {
    return (
      <ConsultiPazienteFallback />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Le Mie Richieste Consulto</h1>
          <p className="mt-2 text-gray-600">
            Gestisci le tue richieste di appuntamento con gli specialisti
          </p>
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
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessuna richiesta trovata
            </h3>
            <p className="text-gray-600 mb-6">
              Non hai ancora richieste di consulto. Inizia prenotando una visita con uno
              specialista.
            </p>
            <button
              onClick={() => router.push('/paziente/specialisti')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Cerca Specialisti
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {richiesteFiltered
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((richiesta) => {
                const badge = STATI_BADGE[richiesta.stato] || STATI_BADGE.pendente;
                return (
                  <div key={richiesta.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            Dott. {richiesta.specialista.nome} {richiesta.specialista.cognome}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                          >
                            {badge.icon} {badge.label}
                          </span>
                          {richiesta.priorita === 'urgente' && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              🚨 Urgente
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-blue-600 font-medium">
                          {richiesta.specialista.specializzazione}
                        </p>
                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                          <div>
                            📅{' '}
                            {new Date(richiesta.dataRichiesta).toLocaleDateString('it-IT', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                          <div>
                            🕐 {richiesta.oraInizio} - {richiesta.oraFine}
                          </div>
                          <div>📋 Tipo: {richiesta.tipoVisita}</div>
                          {richiesta.specialista.indirizzoStudio && (
                            <div>
                              📍 {richiesta.specialista.indirizzoStudio}
                              {richiesta.specialista.citta && `, ${richiesta.specialista.citta}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Motivo:</h4>
                      <p className="text-gray-700">{richiesta.motivo}</p>

                      {richiesta.notePaziente && (
                        <>
                          <h4 className="font-medium text-gray-900 mt-3 mb-2">Tue Note:</h4>
                          <p className="text-gray-700 italic">{richiesta.notePaziente}</p>
                        </>
                      )}

                      {richiesta.noteSpecialista && (
                        <>
                          <h4 className="font-medium text-gray-900 mt-3 mb-2">
                            Note Specialista:
                          </h4>
                          <p className="text-gray-700">{richiesta.noteSpecialista}</p>
                        </>
                      )}

                      {richiesta.stato === 'rifiutata' && richiesta.motivoRifiuto && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="font-medium text-red-900 mb-2">Motivo Rifiuto:</h4>
                          <p className="text-red-700">{richiesta.motivoRifiuto}</p>
                        </div>
                      )}

                      {richiesta.stato === 'confermata' && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-800 font-medium">
                            ✓ Appuntamento confermato!
                          </p>
                          {richiesta.dataConferma && (
                            <p className="text-sm text-green-700 mt-1">
                              Confermato il{' '}
                              {new Date(richiesta.dataConferma).toLocaleDateString('it-IT')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Azioni */}
                    <div className="flex gap-3">
                      {(richiesta.stato === 'pendente' || richiesta.stato === 'confermata') && (
                        <button
                          onClick={() => handleCancellaRichiesta(richiesta.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Cancella Richiesta
                        </button>
                      )}
                      {richiesta.stato === 'rifiutata' && (
                        <button
                          onClick={() =>
                            router.push(
                              `/paziente/specialisti/${richiesta.specialista.id}/calendario`
                            )
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Richiedi Nuovo Appuntamento
                        </button>
                      )}
                      {richiesta.specialista.telefono && (
                        <a
                          href={`tel:${richiesta.specialista.telefono}`}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                        >
                          📞 Chiama
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Link Specialisti */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/paziente/specialisti')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            ← Torna agli Specialisti
          </button>
        </div>
      </div>
    </div>
  );
}
