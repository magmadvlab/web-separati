'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { Badge } from '@/components/ui/badge';
import { FlaskConical } from 'lucide-react';

export default function ProfessionistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const isProfessionista =
    user?.ruolo === 'professionista_sanitario' || user?.ruolo === 'professionista';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.ruolo && !isProfessionista) {
      if (user.ruolo === 'paziente') {
        router.push('/paziente/dashboard');
      } else if (user.ruolo === 'medico') {
        router.push('/medico/dashboard');
      } else if (user.ruolo === 'specialista') {
        router.push('/specialista/dashboard');
      } else if (user.ruolo === 'farmacista') {
        router.push('/farmacia/dashboard');
      } else if (user.ruolo === 'rider') {
        router.push('/delivery/dashboard');
      } else if (user.ruolo === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [isAuthenticated, isProfessionista, user, router]);

  if (!isAuthenticated || !isProfessionista) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar role="professionista" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {/* WEB-08: Banner portale in sviluppo */}
          <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            <FlaskConical className="h-4 w-4 shrink-0" />
            <span>Portale in fase di sviluppo</span>
            <Badge variant="outline" className="ml-1 border-amber-400 text-amber-700">Beta</Badge>
            <span className="text-amber-600">— alcune funzionalità potrebbero non essere ancora disponibili.</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
