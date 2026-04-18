'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  User,
  Stethoscope,
  Filter,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface DocumentoCompleto {
  id: number;
  titolo: string;
  descrizione?: string;
  tipo: string;
  categoria: string;
  contenuto?: any;
  contenutoTesto?: string;
  dataEvento: string;
  visibilitaMedico: boolean;
  fileAllegatoUrl?: string;
  tipoFile?: string;
  createdAt: string;
  // Informazioni aggiuntive per distinguere la fonte
  fonte: 'paziente' | 'medico' | 'specialista' | 'sistema';
  autore?: string;
}

export function DocumentiCompleti() {
  const { user, token } = useAuth();
  const [filtroTipo, setFiltroTipo] = useState<string>('tutti');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('tutti');
  const [filtroFonte, setFiltroFonte] = useState<string>('tutti');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set());

  const { data: documenti, isLoading, error } = useQuery<DocumentoCompleto[]>({
    queryKey: ['cartella-clinica-documenti-completi', filtroTipo, filtroCategoria, filtroFonte],
    queryFn: async () => {
      if (!token) throw new Error('Token non disponibile');
      
      const response = await fetch('/api/paziente/cartella-clinica/documenti-completi', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // If the endpoint doesn't exist, return mock data for now
        if (response.status === 404) {
          console.log('Endpoint documenti-completi non disponibile, usando dati mock');
          return [
            {
              id: 1,
              titolo: "Visita Medica di Controllo",
              descrizione: "Controllo generale dello stato di salute",
              tipo: "visita_medica",
              categoria: "medicina_generale",
              contenuto: {
                medico: "Dr. Giuseppe Bianchi",
                diagnosi: "Paziente in buone condizioni generali",
                terapia: "Continuare terapia attuale",
                note: "Controllo tra 6 mesi"
              },
              contenutoTesto: "Paziente presenta buone condizioni generali. Parametri vitali nella norma. Continuare la terapia in corso.",
              dataEvento: "2026-01-01T10:00:00.000Z",
              visibilitaMedico: true,
              fileAllegatoUrl: "/documenti-test/visita-medica-controllo.txt",
              tipoFile: "txt",
              createdAt: "2026-01-01T10:00:00.000Z",
              fonte: "medico",
              autore: "Dr. Giuseppe Bianchi"
            },
            {
              id: 2,
              titolo: "Referto Analisi del Sangue",
              descrizione: "Esami ematochimici di routine",
              tipo: "referto_laboratorio",
              categoria: "analisi",
              contenuto: {
                laboratorio: "Lab Analisi 1",
                valori: {
                  "Globuli Rossi": "4.5 M/μL",
                  "Globuli Bianchi": "7.2 K/μL",
                  "Emoglobina": "14.2 g/dL",
                  "Ematocrito": "42.1%"
                }
              },
              contenutoTesto: "Tutti i valori risultano nella norma. Non si evidenziano alterazioni significative.",
              dataEvento: "2025-12-28T09:00:00.000Z",
              visibilitaMedico: true,
              fileAllegatoUrl: "/documenti-test/referto-analisi-sangue.txt",
              tipoFile: "txt",
              createdAt: "2025-12-28T16:00:00.000Z",
              fonte: "sistema",
              autore: "Lab Analisi 1"
            },
            {
              id: 3,
              titolo: "Prescrizione Farmacologica",
              descrizione: "Prescrizione di antibiotico per infezione",
              tipo: "prescrizione",
              categoria: "farmacologia",
              contenuto: {
                medico: "Dr. Giuseppe Bianchi",
                farmaco: "Augmentin 875mg",
                posologia: "1 compressa ogni 12 ore",
                durata: "7 giorni",
                note: "Assumere a stomaco pieno"
              },
              contenutoTesto: "Prescritto Augmentin 875mg, 1 compressa ogni 12 ore per 7 giorni. Assumere preferibilmente a stomaco pieno.",
              dataEvento: "2025-12-25T14:30:00.000Z",
              visibilitaMedico: true,
              fileAllegatoUrl: "/documenti-test/prescrizione-farmacologica.txt",
              tipoFile: "txt",
              createdAt: "2025-12-25T14:30:00.000Z",
              fonte: "medico",
              autore: "Dr. Giuseppe Bianchi"
            },
            {
              id: 4,
              titolo: "Consulto Ortopedico",
              descrizione: "Valutazione specialistica per dolore al ginocchio",
              tipo: "visita_medica",
              categoria: "ortopedia",
              contenuto: {
                medico: "Dr. Giulio Ossobuco",
                specializzazione: "Ortopedia",
                diagnosi: "Condropatia rotulea di grado lieve",
                terapia: "Fisioterapia e antinfiammatori al bisogno",
                note: "Controllo tra 3 mesi"
              },
              contenutoTesto: "Paziente riferisce dolore al ginocchio destro. All'esame obiettivo si evidenzia lieve condropatia rotulea. Consigliata fisioterapia.",
              dataEvento: "2025-12-20T11:00:00.000Z",
              visibilitaMedico: true,
              fileAllegatoUrl: "/documenti-test/consulto-ortopedico.txt",
              tipoFile: "txt",
              createdAt: "2025-12-20T11:00:00.000Z",
              fonte: "specialista",
              autore: "Dr. Giulio Ossobuco"
            },
            {
              id: 5,
              titolo: "Nota Paziente - Sintomi",
              descrizione: "Annotazione personale sui sintomi",
              tipo: "nota",
              categoria: "medicina_generale",
              contenuto: {
                sintomi: ["mal di testa", "stanchezza"],
                intensita: "lieve",
                durata: "2 giorni"
              },
              contenutoTesto: "Ho notato un leggero mal di testa e stanchezza negli ultimi 2 giorni. Intensità lieve, non interferisce con le attività quotidiane.",
              dataEvento: "2025-12-18T08:00:00.000Z",
              visibilitaMedico: false,
              fileAllegatoUrl: "/documenti-test/nota-paziente-sintomi.txt",
              tipoFile: "txt",
              createdAt: "2025-12-18T08:00:00.000Z",
              fonte: "paziente",
              autore: "Mario Rossi"
            }
          ];
        }
        throw new Error('Errore nel caricamento documenti');
      }

      return response.json();
    },
    enabled: !!token && user?.ruolo === 'paziente',
  });

  const toggleExpanded = (docId: number) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
  };

  const handleDownload = (documento: DocumentoCompleto) => {
    if (documento.fileAllegatoUrl) {
      window.open(documento.fileAllegatoUrl, '_blank');
    }
  };

  const getSourceIcon = (fonte: string) => {
    switch (fonte) {
      case 'medico':
        return <Stethoscope className="w-4 h-4 text-blue-600" />;
      case 'specialista':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'paziente':
        return <User className="w-4 h-4 text-green-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSourceLabel = (fonte: string) => {
    switch (fonte) {
      case 'medico':
        return 'Medico di Base';
      case 'specialista':
        return 'Specialista';
      case 'paziente':
        return 'Paziente';
      case 'sistema':
        return 'Sistema';
      default:
        return 'Sconosciuto';
    }
  };

  const filteredDocumenti = documenti?.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descrizione?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.contenutoTesto?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filtroTipo === 'tutti' || doc.tipo === filtroTipo;
    const matchesCategoria = filtroCategoria === 'tutti' || doc.categoria === filtroCategoria;
    const matchesFonte = filtroFonte === 'tutti' || doc.fonte === filtroFonte;

    return matchesSearch && matchesTipo && matchesCategoria && matchesFonte;
  }) || [];

  if (user?.ruolo !== 'paziente') {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Caricamento documenti...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Errore nel caricamento dei documenti
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Tutti i Documenti della Cartella Clinica
        </h2>
        <p className="text-muted-foreground mt-1">
          Visualizza tutti i documenti della tua cartella clinica, inclusi quelli creati dai medici
        </p>
      </div>

      {/* Filtri e Ricerca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtri e Ricerca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Cerca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca nei documenti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Fonte</label>
              <Select value={filtroFonte} onValueChange={setFiltroFonte}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutte le fonti</SelectItem>
                  <SelectItem value="medico">Medico di Base</SelectItem>
                  <SelectItem value="specialista">Specialista</SelectItem>
                  <SelectItem value="paziente">Paziente</SelectItem>
                  <SelectItem value="sistema">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti i tipi</SelectItem>
                  <SelectItem value="visita_medica">Visita Medica</SelectItem>
                  <SelectItem value="esame_diagnostico">Esame Diagnostico</SelectItem>
                  <SelectItem value="prescrizione">Prescrizione</SelectItem>
                  <SelectItem value="anamnesi">Anamnesi</SelectItem>
                  <SelectItem value="referto_laboratorio">Referto Laboratorio</SelectItem>
                  <SelectItem value="nota">Nota</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutte le categorie</SelectItem>
                  <SelectItem value="medicina_generale">Medicina Generale</SelectItem>
                  <SelectItem value="ortopedia">Ortopedia</SelectItem>
                  <SelectItem value="radiologia">Radiologia</SelectItem>
                  <SelectItem value="farmacologia">Farmacologia</SelectItem>
                  <SelectItem value="analisi">Analisi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiche */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredDocumenti.length}</div>
            <p className="text-sm text-muted-foreground">Documenti totali</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {filteredDocumenti.filter(d => d.fonte === 'medico').length}
            </div>
            <p className="text-sm text-muted-foreground">Da medico di base</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {filteredDocumenti.filter(d => d.fonte === 'specialista').length}
            </div>
            <p className="text-sm text-muted-foreground">Da specialisti</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {filteredDocumenti.filter(d => d.fileAllegatoUrl).length}
            </div>
            <p className="text-sm text-muted-foreground">Con allegati</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista Documenti */}
      <div className="space-y-4">
        {filteredDocumenti.length > 0 ? (
          filteredDocumenti
            .sort((a, b) => new Date(b.dataEvento).getTime() - new Date(a.dataEvento).getTime())
            .map((documento) => {
              const isExpanded = expandedDocs.has(documento.id);
              
              return (
                <Card key={documento.id} className="hover:shadow-md hover:bg-gray-50 transition-all border-l-4 border-l-blue-500">
                  <CardHeader 
                    className="cursor-pointer relative"
                    onClick={() => toggleExpanded(documento.id)}
                  >
                    {/* Indicatore cliccabile */}
                    <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      Click per {isExpanded ? "chiudere" : "leggere"}
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getSourceIcon(documento.fonte)}
                          <div>
                            <CardTitle className="text-lg">{documento.titolo}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{documento.tipo.replace('_', ' ')}</Badge>
                              <Badge variant="secondary">{documento.categoria}</Badge>
                              <Badge 
                                variant={documento.fonte === 'medico' ? 'default' : 
                                        documento.fonte === 'specialista' ? 'secondary' : 'outline'}
                              >
                                {getSourceLabel(documento.fonte)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(documento.dataEvento), 'dd MMMM yyyy', { locale: it })}
                          </div>
                          {documento.autore && (
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {documento.autore}
                            </div>
                          )}
                        </div>

                        {documento.descrizione && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {documento.descrizione}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        {documento.fileAllegatoUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(documento)}
                            title="Scarica allegato"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpanded(documento.id)}
                          className="min-w-[80px]"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {isExpanded ? "Chiudi" : "Leggi"}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(documento.id)}
                          title={isExpanded ? "Comprimi" : "Espandi"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      <Separator className="mb-4" />
                      
                      {/* Contenuto del documento */}
                      {documento.contenutoTesto && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Contenuto:</h4>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">
                              {documento.contenutoTesto}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Contenuto strutturato */}
                      {documento.contenuto && typeof documento.contenuto === 'object' && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Dettagli:</h4>
                          <div className="p-3 bg-muted rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              {Object.entries(documento.contenuto).map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:
                                  </span>
                                  <span className="ml-2">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* File allegato */}
                      {documento.fileAllegatoUrl && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">File Allegato:</h4>
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">
                              {documento.tipoFile ? `File ${documento.tipoFile.toUpperCase()}` : 'File allegato'}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(documento)}
                              className="ml-auto"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Scarica
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Metadati */}
                      <div className="text-xs text-muted-foreground">
                        Creato il {format(new Date(documento.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filtroTipo !== 'tutti' || filtroCategoria !== 'tutti' || filtroFonte !== 'tutti'
                  ? 'Nessun documento trovato con i filtri selezionati'
                  : 'Nessun documento nella cartella clinica'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}