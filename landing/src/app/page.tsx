'use client';

const portals = [
  { role: 'Medico', path: '/medico', color: 'bg-blue-600', icon: '🩺', desc: 'Prescrizioni e pazienti' },
  { role: 'Paziente', path: '/paziente', color: 'bg-green-600', icon: '👤', desc: 'Terapie e referti' },
  { role: 'Farmacista', path: '/farmacista', color: 'bg-orange-500', icon: '💊', desc: 'Ordini e dispensazione' },
  { role: 'Specialista', path: '/specialista', color: 'bg-purple-600', icon: '🔬', desc: 'Consulti e referti' },
  { role: 'Laboratorio', path: '/laboratorio', color: 'bg-teal-600', icon: '🧪', desc: 'Prenotazioni e risultati' },
  { role: 'Professionista', path: '/professionista', color: 'bg-indigo-600', icon: '👨‍⚕️', desc: 'Appuntamenti e assistiti' },
  { role: 'Fornitore', path: '/fornitore', color: 'bg-gray-600', icon: '🏭', desc: 'Gestione forniture' },
  { role: 'Admin', path: '/admin', color: 'bg-red-700', icon: '⚙️', desc: 'Pannello amministrativo' },
];

const envUrls: Record<string, string | undefined> = {
  medico: process.env.NEXT_PUBLIC_URL_MEDICO,
  paziente: process.env.NEXT_PUBLIC_URL_PAZIENTE,
  farmacista: process.env.NEXT_PUBLIC_URL_FARMACISTA,
  specialista: process.env.NEXT_PUBLIC_URL_SPECIALISTA,
  laboratorio: process.env.NEXT_PUBLIC_URL_LABORATORIO,
  professionista: process.env.NEXT_PUBLIC_URL_PROFESSIONISTA,
  fornitore: process.env.NEXT_PUBLIC_URL_FORNITORE,
  admin: process.env.NEXT_PUBLIC_URL_ADMIN,
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">RicettaZero</h1>
          <p className="text-gray-400">Architettura separata per ruolo — seleziona il tuo portale</p>
          <span className="inline-block mt-3 px-3 py-1 text-xs bg-yellow-600/30 text-yellow-300 rounded-full border border-yellow-600/50">
            Ambiente di test — v2 separata
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {portals.map(({ role, path, color, icon, desc }) => {
            const key = path.replace('/', '');
            const url = envUrls[key] ?? `http://localhost:300${portals.findIndex(p => p.path === path) + 1}`;
            return (
              <a
                key={role}
                href={url}
                className={`${color} rounded-xl p-6 flex flex-col gap-2 hover:opacity-90 transition-opacity cursor-pointer`}
              >
                <span className="text-3xl">{icon}</span>
                <span className="font-semibold text-lg">{role}</span>
                <span className="text-sm opacity-80">{desc}</span>
              </a>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <a
            href={process.env.NEXT_PUBLIC_URL_LEGACY ?? 'https://web-production-xxxx.up.railway.app'}
            className="text-sm text-gray-500 hover:text-gray-300 underline"
          >
            ← Torna alla versione precedente (monolite)
          </a>
        </div>
      </div>
    </main>
  );
}
