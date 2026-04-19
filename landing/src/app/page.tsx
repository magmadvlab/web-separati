'use client';

const BASE = process.env.NEXT_PUBLIC_LEGACY_URL ?? 'https://ricettazero.up.railway.app';

const portals = [
  { key: 'medico',         role: 'Medico',             color: 'bg-blue-600',   icon: '🩺', desc: 'Prescrizioni e pazienti',  url: process.env.NEXT_PUBLIC_URL_MEDICO        ?? `${BASE}/medico/login` },
  { key: 'paziente',       role: 'Paziente',            color: 'bg-green-600',  icon: '👤', desc: 'Terapie e referti',         url: process.env.NEXT_PUBLIC_URL_PAZIENTE      ?? `${BASE}/paziente/dashboard` },
  { key: 'farmacista',     role: 'Farmacia',            color: 'bg-orange-500', icon: '💊', desc: 'Ordini e dispensazione',    url: process.env.NEXT_PUBLIC_URL_FARMACISTA    ?? `${BASE}/farmacia/ordini` },
  { key: 'delivery',       role: 'Delivery',            color: 'bg-yellow-600', icon: '🚚', desc: 'Consegne e logistica',      url: process.env.NEXT_PUBLIC_URL_DELIVERY      ?? `${BASE}/delivery/dashboard` },
  { key: 'specialista',    role: 'Specialista',         color: 'bg-purple-600', icon: '🔬', desc: 'Consulti e referti',        url: process.env.NEXT_PUBLIC_URL_SPECIALISTA   ?? `${BASE}/specialista` },
  { key: 'laboratorio',    role: 'Laboratorio',         color: 'bg-teal-600',   icon: '🧪', desc: 'Prenotazioni e risultati', url: process.env.NEXT_PUBLIC_URL_LABORATORIO   ?? `${BASE}/laboratorio/dashboard` },
  { key: 'professionista', role: 'Professionista',      color: 'bg-indigo-600', icon: '👨‍⚕️', desc: 'Appuntamenti e assistiti', url: process.env.NEXT_PUBLIC_URL_PROFESSIONISTA ?? `${BASE}/professionista/appuntamenti` },
  { key: 'fornitore',      role: 'Fornitore sanitario', color: 'bg-gray-600',   icon: '🏭', desc: 'Gestione forniture',        url: process.env.NEXT_PUBLIC_URL_FORNITORE     ?? `${BASE}/fornitore` },
  { key: 'admin',          role: 'Admin',               color: 'bg-red-700',    icon: '⚙️', desc: 'Pannello amministrativo',  url: process.env.NEXT_PUBLIC_URL_ADMIN         ?? `${BASE}/admin/dashboard` },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">RicettaZero</h1>
          <p className="text-gray-400">Architettura separata per ruolo — seleziona il tuo portale</p>
          <span className="inline-block mt-3 px-3 py-1 text-xs bg-yellow-600/30 text-yellow-300 rounded-full border border-yellow-600/50">
            v2 — frontend separati
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {portals.map(({ key, role, color, icon, desc, url }) => (
            <a
              key={key}
              href={url}
              className={`${color} rounded-xl p-6 flex flex-col gap-2 hover:opacity-90 transition-opacity cursor-pointer`}
            >
              <span className="text-3xl">{icon}</span>
              <span className="font-semibold text-lg">{role}</span>
              <span className="text-sm opacity-80">{desc}</span>
            </a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={BASE}
            className="text-sm text-gray-500 hover:text-gray-300 underline"
          >
            ← Torna alla versione precedente (monolite)
          </a>
        </div>
      </div>
    </main>
  );
}
