'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import {
  Shield,
  LogOut,
  Settings,
  Users,
  MapPin,
  BarChart3,
  ArrowRightLeft,
  Truck,
  Package,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica che l'utente sia autenticato e sia admin
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.ruolo !== 'admin') {
      router.push('/');
      return;
    }

    setIsLoading(false);
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifica autorizzazioni admin...</p>
        </div>
      </div>
    );
  }

  if (!user || user.ruolo !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-red-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">RicettaZero Admin</h1>
                  <p className="text-xs text-gray-500">Pannello Amministrazione</p>
                </div>
              </div>
              <Badge variant="destructive" className="ml-4">
                ADMIN ONLY
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Admin Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <div className="space-y-2">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard</span>
                {/* WEB-08: Analytics parziali */}
                <Badge variant="outline" className="ml-auto text-xs border-amber-400 text-amber-700">Beta</Badge>
              </Link>

              <Link
                href="/admin/territorial"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <MapPin className="h-5 w-5" />
                <span>Sistema Territoriale</span>
              </Link>

              <Link
                href="/admin/batch"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Truck className="h-5 w-5" />
                <span>Batch Delivery</span>
              </Link>

              <Link
                href="/admin/riders"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Package className="h-5 w-5" />
                <span>Riders</span>
              </Link>

              <Link
                href="/admin/ordini"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Ordini Disponibili</span>
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Users className="h-5 w-5" />
                <span>Gestione Utenti</span>
              </Link>

              <Link
                href="/admin/medici/richieste-cambio"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <ArrowRightLeft className="h-5 w-5" />
                <span>Cambio Medico</span>
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span>Impostazioni</span>
              </Link>
            </div>

            {/* Security Warning */}
            <div className="mt-8 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-red-800">Area Riservata</span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                Accesso limitato agli amministratori di sistema
              </p>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
