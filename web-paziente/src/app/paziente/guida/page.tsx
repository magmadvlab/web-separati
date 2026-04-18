"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  FileText, 
  Download, 
  ExternalLink,
  Search,
  BookMarked,
  Heart,
  Shield,
  MessageSquare,
  Calendar,
  Pill,
  ClipboardList
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function GuidaPage() {
  const [manualeContent, setManualeContent] = useState<string>("");
  const [diarioContent, setDiarioContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carica i contenuti dei manuali
    Promise.all([
      fetch("/docs/MANUALE_UTENTE_PAZIENTE.md").then(r => r.text()),
      fetch("/docs/DIARIO_SALUTE_GUIDA.md").then(r => r.text())
    ]).then(([manuale, diario]) => {
      setManualeContent(manuale);
      setDiarioContent(diario);
      setLoading(false);
    }).catch(error => {
      console.error("Errore caricamento guide:", error);
      setLoading(false);
    });
  }, []);

  const downloadManuale = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const quickLinks = [
    { 
      title: "Dashboard", 
      icon: BookOpen, 
      href: "#dashboard",
      description: "Panoramica e statistiche principali"
    },
    { 
      title: "Reminder Farmaci", 
      icon: ClipboardList, 
      href: "#reminder",
      description: "Come gestire i reminder delle assunzioni"
    },
    { 
      title: "Patologie", 
      icon: Heart, 
      href: "#patologie",
      description: "Gestire le condizioni mediche"
    },
    { 
      title: "Terapie", 
      icon: Pill, 
      href: "#terapie",
      description: "Creare e gestire le terapie"
    },
    { 
      title: "Cure Preventive", 
      icon: Shield, 
      href: "#cure-preventive",
      description: "Vaccinazioni e controlli periodici"
    },
    { 
      title: "Diario Salute", 
      icon: BookMarked, 
      href: "#cartella-clinica",
      description: "Registrare sintomi e misurazioni"
    },
    { 
      title: "Messaggi", 
      icon: MessageSquare, 
      href: "#messaggi",
      description: "Comunicare con medici e specialisti"
    },
    { 
      title: "Consulti", 
      icon: Calendar, 
      href: "#consulti",
      description: "Prenotare e gestire consulti"
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento guide...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Guida Utente
          </h1>
          <p className="text-gray-600 mt-2">
            Manuali completi per utilizzare tutte le funzionalità della piattaforma
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Accesso Rapido
          </CardTitle>
          <CardDescription>
            Vai direttamente alla sezione che ti interessa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 text-primary mt-1 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="font-medium text-sm mb-1">{link.title}</h3>
                      <p className="text-xs text-gray-600">{link.description}</p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabs per i manuali */}
      <Tabs defaultValue="manuale" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manuale" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Manuale Completo
          </TabsTrigger>
          <TabsTrigger value="diario" className="flex items-center gap-2">
            <BookMarked className="h-4 w-4" />
            Guida Diario Salute
          </TabsTrigger>
        </TabsList>

        {/* Manuale Completo */}
        <TabsContent value="manuale">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Manuale Utente Paziente</CardTitle>
                  <CardDescription>
                    Guida completa a tutte le funzionalità della piattaforma
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadManuale("MANUALE_UTENTE_PAZIENTE.md", manualeContent)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Scarica PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("/docs/MANUALE_UTENTE_PAZIENTE.md", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Apri in nuova tab
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{manualeContent}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guida Diario Salute */}
        <TabsContent value="diario">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Guida al Diario Salute</CardTitle>
                  <CardDescription>
                    Come registrare sintomi, misurazioni, eventi medici e note
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadManuale("DIARIO_SALUTE_GUIDA.md", diarioContent)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Scarica PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("/docs/DIARIO_SALUTE_GUIDA.md", "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Apri in nuova tab
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{diarioContent}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sezione Supporto */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <MessageSquare className="h-5 w-5" />
            Hai bisogno di aiuto?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-800 mb-4">
            Se non trovi la risposta che cerchi nella guida, il nostro team di supporto è qui per aiutarti.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <a href="/supporto">
                Apri Ticket di Supporto
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/paziente/messaggi">
                Contatta il Medico
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
