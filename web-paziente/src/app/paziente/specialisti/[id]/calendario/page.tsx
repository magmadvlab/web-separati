'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Slot {
  oraInizio: string;
  oraFine: string;
  postiTotali: number;
  postiOccupati: number;
  postiDisponibili: number;
  disponibile: boolean;
}

interface Specialista {
  id: number;
  nome: string;
  cognome: string;
  specializzazione: string;
  email: string;
  telefono?: string;
  indirizzoStudio?: string;
  citta?: string;
}

export default function CalendarioSpecialistaPage() {
  const router = useRouter();
  const params = useParams();
  const specialistaId = parseInt(params.id as string);

  const [specialista, setSpecialista] = useState<Specialista | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Form richiesta
  const [formData, setFormData] = useState({
    motivo: '',
    tipoVisita: 'prima_visita',
    priorita: 'normale',
    notePaziente: '',
  });

  useEffect(() => {
    loadSpecialista();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadSlots();
    }
  }, [selectedDate]);

  const loadSpecialista = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/specialista/permessi`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const permesso = data.find((p: any) => p.specialista.id === specialistaId);
        if (permesso) {
          setSpecialista(permesso.specialista);
        }
      }
    } catch (error) {
      console.error('Errore:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const token = localStorage.getItem('token');
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // TODO: Implementare endpoint pubblico per vedere slots
      // Per ora usiamo un endpoint mock
      const res = await fetch(`/api/specialista/calendario/slots/${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      } else {
        setSlots([]);
      }
    } catch (error) {
      console.error('Errore:', error);
      setSlots([]);
    }
  };

  const handleRequestConsulto = async () => {
    if (!selectedSlot || !specialista) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/paziente/consulti', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          specialistaId: specialista.id,
          dataRichiesta: selectedDate.toISOString().split('T')[0],
          oraInizio: selectedSlot.oraInizio,
          oraFine: selectedSlot.oraFine,
          ...formData,
        }),
      });

      if (res.ok) {
        alert('Richiesta inviata con successo! Lo specialista riceverà una notifica.');
        router.push('/paziente/consulti');
      } else {
        const error = await res.json();
        alert(error.message || 'Errore durante l\'invio della richiesta');
      }
    } catch (error) {
      console.error('Errore:', error);
      alert('Errore durante l\'invio della richiesta');
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
    setSelectedSlot(null);
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

  if (!specialista) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Specialista non trovato</p>
          <button
            onClick={() => router.push('/paziente/specialisti')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Torna alla Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Specialista */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Dott. {specialista.nome} {specialista.cognome}
              </h1>
              <p className="text-lg text-blue-600 font-medium mt-1">
                {specialista.specializzazione}
              </p>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {specialista.indirizzoStudio && (
                  <div className="flex items-center gap-2">
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
              </div>
            </div>
            <button
              onClick={() => router.push('/paziente/specialisti')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Indietro
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendario */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Seleziona Data e Orario
              </h2>

              {/* Navigazione Data */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => changeDate(-1)}
                  disabled={selectedDate <= new Date()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Giorno Precedente
                </button>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString('it-IT', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <button
                  onClick={() => changeDate(1)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Giorno Successivo →
                </button>
              </div>

              {/* Slots Disponibili */}
              {slots.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔒</div>
                  <p className="text-gray-600">
                    Nessuno slot disponibile per questa data
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Prova a selezionare un'altra data
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {slots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => slot.disponibile && setSelectedSlot(slot)}
                      disabled={!slot.disponibile}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedSlot?.oraInizio === slot.oraInizio
                          ? 'border-blue-600 bg-blue-50'
                          : slot.disponibile
                          ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{slot.oraInizio}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {slot.disponibile ? (
                          <span className="text-green-600">
                            ✓ {slot.postiDisponibili} posto/i
                          </span>
                        ) : (
                          <span className="text-red-600">✗ Completo</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Riepilogo e Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Riepilogo Prenotazione
              </h3>

              {selectedSlot ? (
                <>
                  <div className="space-y-3 mb-6 p-4 bg-blue-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Data</div>
                      <div className="font-medium text-gray-900">
                        {selectedDate.toLocaleDateString('it-IT', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Orario</div>
                      <div className="font-medium text-gray-900">
                        {selectedSlot.oraInizio} - {selectedSlot.oraFine}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Specialista</div>
                      <div className="font-medium text-gray-900">
                        Dott. {specialista.cognome}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    Richiedi Consulto
                  </button>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-sm">Seleziona un orario disponibile per continuare</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Richiesta */}
      {showRequestModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-semibold mb-6">Richiesta Consulto</h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Data:</span>
                    <span className="ml-2 font-medium">
                      {selectedDate.toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Orario:</span>
                    <span className="ml-2 font-medium">{selectedSlot.oraInizio}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del Consulto *
                </label>
                <textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="Descrivi brevemente il motivo della visita..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo Visita
                </label>
                <select
                  value={formData.tipoVisita}
                  onChange={(e) => setFormData({ ...formData, tipoVisita: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="prima_visita">Prima Visita</option>
                  <option value="controllo">Controllo</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorità
                </label>
                <select
                  value={formData.priorita}
                  onChange={(e) => setFormData({ ...formData, priorita: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="normale">Normale</option>
                  <option value="urgente">Urgente</option>
                  <option value="programmata">Programmata</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Aggiuntive (opzionale)
                </label>
                <textarea
                  value={formData.notePaziente}
                  onChange={(e) =>
                    setFormData({ ...formData, notePaziente: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Eventuali note o informazioni aggiuntive..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  onClick={handleRequestConsulto}
                  disabled={!formData.motivo.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Invia Richiesta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
