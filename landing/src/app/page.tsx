'use client';

const portals = [
  { key: 'medico',        role: 'Medico',              color: 'bg-blue-600',   icon: '🩺', desc: 'Prescrizioni e pazienti',   env: process.env.NEXT_PUBLIC_URL_MEDICO },
  { key: 'paziente',      role: 'Paziente',             color: 'bg-green-600',  icon: '👤', desc: 'Terapie e referti',          env: process.env.NEXT_PUBLIC_URL_PAZIENTE },
  { key: 'farmacista',    role: 'Farmacia',             color: 'bg-orange-500', icon: '💊', desc: 'Ordini e dispensazione',      env: process.env.NEXT_PUBLIC_URL_FARMACISTA },
  { key: 'specialista',   role: 'Specialista',          color: 'bg-purple-600', icon: '🔬', desc: 'Consulti e referti',          env: process.env.NEXT_PUBLIC_URL_SPECIALISTA },
  { key: 'laboratorio',   role: 'Laboratorio',          color: 'bg-teal-600',   icon: '🧪', desc: 'Prenotazioni e risultati',    env: process.env.NEXT_PUBLIC_URL_LABORATORIO },
  { key: 'professionista',role: 'Professionista',       color: 'bg-indigo-600', icon: '👨‍⚕️', desc: 'Appuntamenti e assistiti',   env: process.env.NEXT_PUBLIC_URL_PROFESSIONISTA },
  { key: 'fornitore',     role: 'Fornitore sanitario',  color: 'bg-gray-600',   icon: '🏭', desc: 'Gestione forniture',          env: process.env.NEXT_PUBLIC_URL_FORNITORE },
  { key: 'admin',         role: 'Admin',                color: 'bg-red-700',    icon: '⚙️', desc: 'Pannello amministrativo',     env: process.env.NEXT_PUBLIC_URL_ADMIN },
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
          {portals.map(({ key, role, color, icon, desc, env }) => {
            const url = env;
            const ready = !!url;
            return (
              <a
                key={key}
                href={ready ? url : undefined}
                className={`${color} rounded-xl p-6 flex flex-col gap-2 transition-opacity ${ready ? 'hover:opacity-90 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
              >
                <span className="text-3xl">{icon}</span>
                <span className="font-semibold text-lg">{role}</span>
                <span className="text-sm opacity-80">{desc}</span>
                {!ready && <span className="text-xs mt-1 opacity-60">— in configurazione</span>}
              </a>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <a
            href={process.env.NEXT_PUBLIC_URL_LEGACY ?? 'https://ricettazero.up.railway.app'}
            className="text-sm text-gray-500 hover:text-gray-300 underline"
          >
            ← Versione precedente (monolite)
          </a>
        </div>
      </div>
    </main>
  );
}
