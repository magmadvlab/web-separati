'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Stats {
  richiesteInAttesa: number;
  appuntamentiOggi: number;
  appuntamentiSettimana: number;
}

export default function ProfessionistaDashboard() {
  const [stats, setStats] = useState<Stats>({
    richiesteInAttesa: 0,
    appuntamentiOggi: 0,
    appuntamentiSettimana: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [richiesteRes, appuntamentiRes] = await Promise.allSettled([
        api.get('/professionista/richieste-appuntamento?stato=in_attesa'),
        api.get('/professionista/appuntamenti'),
      ]);

      const richieste =
        richiesteRes.status === 'fulfilled'
          ? Array.isArray(richiesteRes.value.data) ? richiesteRes.value.data : richiesteRes.value.data?.data || []
          : [];

      const appuntamenti =
        appuntamentiRes.status === 'fulfilled'
          ? Array.isArray(appuntamentiRes.value.data) ? appuntamentiRes.value.data : appuntamentiRes.value.data?.data || []
          : [];

      const oggi = new Date().toISOString().split('T')[0];
      const inizioSettimana = new Date();
      inizioSettimana.setDate(inizioSettimana.getDate() - inizioSettimana.getDay() + 1);
      const fineSettimana = new Date(inizioSettimana);
      fineSettimana.setDate(fineSettimana.getDate() + 6);

      const appOggi = appuntamenti.filter((a: any) => {
        const d = (a.dataAppuntamento || a.data_appuntamento || '').split('T')[0];
        return d === oggi;
      });

      setStats({
        richiesteInAttesa: richieste.length,
        appuntamentiOggi: appOggi.length,
        appuntamentiSettimana: appuntamenti.length,
      });
    } catch (error) {
      console.error('Errore caricamento stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Professionista</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Richieste in Attesa</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.richiesteInAttesa}</div>
            <Link href="/professionista/richieste" className="text-xs text-blue-600 hover:underline">
              Gestisci richieste
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appuntamenti Oggi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appuntamentiOggi}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appuntamenti Totali</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.appuntamentiSettimana}</div>
            <Link href="/professionista/calendario" className="text-xs text-blue-600 hover:underline">
              Vai al calendario
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/professionista/richieste" className="block">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardList className="w-4 h-4 mr-2" />
                Gestisci Richieste Appuntamento
              </Button>
            </Link>
            <Link href="/professionista/calendario" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Visualizza Calendario
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
