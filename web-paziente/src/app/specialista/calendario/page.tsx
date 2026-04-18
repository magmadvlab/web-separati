'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Disponibilita {
  id: number;
  giornoSettimana: number;
  oraInizio: string;
  oraFine: string;
  durataSlot: number;
  postiPerSlot: number;
  note?: string;
  attivo: boolean;
}

interface Eccezione {
  id: number;
  data: string;
  tipo: string;
  oraInizio?: string;
  oraFine?: string;
  motivo?: string;
}

const GIORNI_SETTIMANA = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function CalendarioSpecialistaPage() {
  const router = useRouter();
  const [disponibilita, setDisponibilita] = useState<Disponibilita[]>([]);
  const [eccezioni, setEccezioni] = useState<Eccezione[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDisponibilita, setShowAddDisponibilita] = useState(false);
  const [showAddEccezione, setShowAddEccezione] = useState(false);

  // Form disponibilità
  const [formDisp, setFormDisp] = useState({
    giornoSettimana: 1,
    oraInizio: '09:00',
    oraFine: '13:00',
    durataSlot: 30,
    postiPerSlot: 1,
    note: '',
  });

  // Form eccezione
  const [formEcc, setFormEcc] = useState({
    data: '',
    tipo: 'chiusura',
    oraInizio: '',
    oraFine: '',
    motivo: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [dispRes, eccRes] = await Promise.all([
        fetch('/api/specialista/calendario/disponibilita', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/specialista/calendario/eccezioni', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (dispRes.ok) {
        const data = await dispRes.json();
        setDisponibilita(data);
      }

      if (eccRes.ok) {
        const data = await eccRes.json();
        setEccezioni(data);
      }
    } catch (error) {
      console.error('Errore caricamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDisponibilita = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/specialista/calendario/disponibilita', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formDisp),
      });

      if (res.ok) {
        setShowAddDisponibilita(false);
        loadData();
        setFormDisp({
          giornoSettimana: 1,
          oraInizio: '09:00',
          oraFine: '13:00',
          durataSlot: 30,
          postiPerSlot: 1,
          note: '',
        });
      }
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  const handleAddEccezione = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/specialista/calendario/eccezioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formEcc),
      });

      if (res.ok) {
        setShowAddEccezione(false);
        loadData();
        setFormEcc({
          data: '',
          tipo: 'chiusura',
          oraInizio: '',
          oraFine: '',
          motivo: '',
        });
      }
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  const handleDeleteDisponibilita = async (id: number) => {
    if (!confirm('Eliminare questa disponibilità?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/specialista/calendario/disponibilita/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Errore:', error);
    }
  };

  const handleDeleteEccezione = async (id: number) => {
    if (!confirm('Eliminare questa eccezione?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/specialista/calendario/eccezioni/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Errore:', error);
    }
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestione Calendario</h1>
          <p className="mt-2 text-gray-600">
            Configura i tuoi orari di disponibilità e gestisci ferie/chiusure
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Disponibilità Settimanale */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Orari Settimanali</h2>
              <button
                onClick={() => setShowAddDisponibilita(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Aggiungi Orario
              </button>
            </div>

            {disponibilita.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nessun orario configurato. Aggiungi i tuoi orari di disponibilità.
              </p>
            ) : (
              <div className="space-y-3">
                {disponibilita
                  .sort((a, b) => a.giornoSettimana - b.giornoSettimana)
                  .map((disp) => (
                    <div
                      key={disp.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {GIORNI_SETTIMANA[disp.giornoSettimana]}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {disp.oraInizio} - {disp.oraFine}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Slot: {disp.durataSlot} min • Max {disp.postiPerSlot} paziente/i
                          </div>
                          {disp.note && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              {disp.note}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteDisponibilita(disp.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Eccezioni (Ferie/Chiusure) */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Ferie & Chiusure</h2>
              <button
                onClick={() => setShowAddEccezione(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                + Aggiungi Eccezione
              </button>
            </div>

            {eccezioni.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nessuna eccezione configurata.
              </p>
            ) : (
              <div className="space-y-3">
                {eccezioni
                  .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                  .map((ecc) => (
                    <div
                      key={ecc.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-orange-300"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {new Date(ecc.data).toLocaleDateString('it-IT', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {ecc.tipo === 'chiusura' ? '🔒 Chiusura' : '⏰ Orario Speciale'}
                          </div>
                          {ecc.tipo === 'orario_speciale' && ecc.oraInizio && (
                            <div className="text-xs text-gray-500 mt-1">
                              {ecc.oraInizio} - {ecc.oraFine}
                            </div>
                          )}
                          {ecc.motivo && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              {ecc.motivo}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteEccezione(ecc.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Link Richieste */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/specialista/richieste')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Vedi Richieste Consulto →
          </button>
        </div>
      </div>

      {/* Modal Aggiungi Disponibilità */}
      {showAddDisponibilita && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Aggiungi Orario</h3>
            <form onSubmit={handleAddDisponibilita} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giorno
                </label>
                <select
                  value={formDisp.giornoSettimana}
                  onChange={(e) =>
                    setFormDisp({ ...formDisp, giornoSettimana: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {GIORNI_SETTIMANA.map((giorno, idx) => (
                    <option key={idx} value={idx}>
                      {giorno}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ora Inizio
                  </label>
                  <input
                    type="time"
                    value={formDisp.oraInizio}
                    onChange={(e) => setFormDisp({ ...formDisp, oraInizio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ora Fine
                  </label>
                  <input
                    type="time"
                    value={formDisp.oraFine}
                    onChange={(e) => setFormDisp({ ...formDisp, oraFine: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durata Slot (min)
                  </label>
                  <input
                    type="number"
                    value={formDisp.durataSlot}
                    onChange={(e) =>
                      setFormDisp({ ...formDisp, durataSlot: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="15"
                    step="15"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posti per Slot
                  </label>
                  <input
                    type="number"
                    value={formDisp.postiPerSlot}
                    onChange={(e) =>
                      setFormDisp({ ...formDisp, postiPerSlot: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (opzionale)
                </label>
                <input
                  type="text"
                  value={formDisp.note}
                  onChange={(e) => setFormDisp({ ...formDisp, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Es: Solo visite di controllo"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddDisponibilita(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aggiungi Eccezione */}
      {showAddEccezione && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Aggiungi Eccezione</h3>
            <form onSubmit={handleAddEccezione} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={formEcc.data}
                  onChange={(e) => setFormEcc({ ...formEcc, data: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formEcc.tipo}
                  onChange={(e) => setFormEcc({ ...formEcc, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="chiusura">Chiusura</option>
                  <option value="orario_speciale">Orario Speciale</option>
                  <option value="ferie">Ferie</option>
                  <option value="congedo">Congedo</option>
                  <option value="formazione">Formazione</option>
                </select>
              </div>

              {formEcc.tipo === 'orario_speciale' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ora Inizio
                    </label>
                    <input
                      type="time"
                      value={formEcc.oraInizio}
                      onChange={(e) => setFormEcc({ ...formEcc, oraInizio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ora Fine
                    </label>
                    <input
                      type="time"
                      value={formEcc.oraFine}
                      onChange={(e) => setFormEcc({ ...formEcc, oraFine: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo (opzionale)
                </label>
                <textarea
                  value={formEcc.motivo}
                  onChange={(e) => setFormEcc({ ...formEcc, motivo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Es: Ferie estive"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddEccezione(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Salva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
