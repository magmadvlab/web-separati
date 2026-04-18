"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loading } from "@/components/shared/Loading";
import { FileText, Calendar, Building2, Download, Eye, X } from "lucide-react";

interface RefertoLaboratorio {
  id: number;
  tipoEsame: string;
  dataEsame: string;
  dataRisultato: string;
  stato: string;
  risultatiJson: any;
  refertoMedico?: string;
  refertoUrl?: string;
  laboratorio: {
    nome: string;
    indirizzo?: string;
  };
  prescrizioneAnalisi?: {
    id: number;
    codiceNre: string;
    medico?: {
      nome: string;
      cognome: string;
    };
  };
}

interface StatisticheReferti {
  totaleReferti: number;
  refertiRecenti: number;
  ultimoReferto?: string;
  tipiEsame: string[];
}

export function RefertiLaboratorio() {
  const [refertoSelezionato, setRefertoSelezionato] = useState<RefertoLaboratorio | null>(null);

  // Carica referti recenti
  const { data: refertiRecenti, isLoading: loadingRecenti } = useQuery<RefertoLaboratorio[]>({
    queryKey: ["paziente-referti-recenti"],
    queryFn: async () => {
      const response = await api.get("/paziente/referti-laboratorio/recenti");
      return response.data.data;
    },
  });

  // Carica statistiche
  const { data: statistiche } = useQuery<StatisticheReferti>({
    queryKey: ["paziente-referti-statistiche"],
    queryFn: async () => {
      const response = await api.get("/paziente/referti-laboratorio/statistiche");
      return response.data.data;
    },
  });

  // Dati mockup per demo quando non ci sono referti reali
  const refertiMockup: RefertoLaboratorio[] = [
    {
      id: 1,
      tipoEsame: "Emocromo Completo",
      dataEsame: "2025-12-16T00:00:00.000Z",
      dataRisultato: "2025-12-17T00:00:00.000Z",
      stato: "completato",
      risultatiJson: {
        globuli_rossi: { valore: 4.8, unita: "milioni/μL", range_normale: "4.5-5.9", normale: true },
        emoglobina: { valore: 14.2, unita: "g/dL", range_normale: "14.0-18.0", normale: true },
        ematocrito: { valore: 42.5, unita: "%", range_normale: "42-52", normale: true },
        globuli_bianchi: { valore: 7200, unita: "/μL", range_normale: "4000-11000", normale: true },
        piastrine: { valore: 280000, unita: "/μL", range_normale: "150000-450000", normale: true }
      },
      refertoMedico: "Emocromo nella norma. Tutti i parametri ematologici risultano nei range di riferimento.",
      laboratorio: {
        nome: "Lab Analisi Milano",
        indirizzo: "Via Laboratorio 15, Milano"
      },
      prescrizioneAnalisi: {
        id: 1,
        codiceNre: "NRE001234567",
        medico: {
          nome: "Giuseppe",
          cognome: "Bianchi"
        }
      }
    },
    {
      id: 2,
      tipoEsame: "Profilo Lipidico",
      dataEsame: "2025-12-21T00:00:00.000Z",
      dataRisultato: "2025-12-22T00:00:00.000Z",
      stato: "completato",
      risultatiJson: {
        colesterolo_totale: { valore: 185, unita: "mg/dL", range_normale: "<200", normale: true },
        colesterolo_hdl: { valore: 55, unita: "mg/dL", range_normale: ">40", normale: true },
        colesterolo_ldl: { valore: 110, unita: "mg/dL", range_normale: "<130", normale: true },
        trigliceridi: { valore: 95, unita: "mg/dL", range_normale: "<150", normale: true }
      },
      refertoMedico: "Profilo lipidico ottimale. Tutti i parametri lipidici sono nei range desiderabili per la prevenzione cardiovascolare.",
      laboratorio: {
        nome: "Lab Analisi Milano",
        indirizzo: "Via Laboratorio 15, Milano"
      },
      prescrizioneAnalisi: {
        id: 2,
        codiceNre: "NRE001234568",
        medico: {
          nome: "Giuseppe",
          cognome: "Bianchi"
        }
      }
    },
    {
      id: 3,
      tipoEsame: "Funzionalità Renale",
      dataEsame: "2025-12-29T00:00:00.000Z",
      dataRisultato: "2025-12-30T00:00:00.000Z",
      stato: "completato",
      risultatiJson: {
        creatinina: { valore: 0.9, unita: "mg/dL", range_normale: "0.7-1.2", normale: true },
        urea: { valore: 35, unita: "mg/dL", range_normale: "15-50", normale: true },
        acido_urico: { valore: 5.2, unita: "mg/dL", range_normale: "3.5-7.2", normale: true },
        clearance_creatinina: { valore: 95, unita: "mL/min", range_normale: ">90", normale: true }
      },
      refertoMedico: "Funzionalità renale nella norma. Tutti gli indici di funzione renale sono ottimali.",
      laboratorio: {
        nome: "Lab Analisi Milano",
        indirizzo: "Via Laboratorio 15, Milano"
      },
      prescrizioneAnalisi: {
        id: 3,
        codiceNre: "NRE001234569",
        medico: {
          nome: "Giuseppe",
          cognome: "Bianchi"
        }
      }
    }
  ];

  // Statistiche mockup
  const statisticheMockup = {
    totaleReferti: 3,
    refertiRecenti: 3,
    ultimoReferto: "2025-12-30",
    tipiEsame: ["Emocromo Completo", "Profilo Lipidico", "Funzionalità Renale"]
  };

  // Usa dati reali se disponibili, altrimenti mockup per demo
  const refertiDaMostrare = refertiRecenti && refertiRecenti.length > 0 ? refertiRecenti : refertiMockup;
  const statisticheDaMostrare = statistiche && statistiche.totaleReferti > 0 ? statistiche : statisticheMockup;

  if (loadingRecenti) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Totale referti</p>
                <p className="text-2xl font-bold">{statisticheDaMostrare?.totaleReferti || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Ultimi 30 giorni</p>
                <p className="text-2xl font-bold">{statisticheDaMostrare?.refertiRecenti || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Tipi esame</p>
                <p className="text-2xl font-bold">{statisticheDaMostrare?.tipiEsame?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Ultimo referto</p>
                <p className="text-sm font-medium">
                  {statisticheDaMostrare?.ultimoReferto 
                    ? format(new Date(statisticheDaMostrare.ultimoReferto), "dd MMM yyyy", { locale: it })
                    : "Nessuno"
                  }</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista referti recenti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Referti recenti (ultimi 30 giorni)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!refertiDaMostrare || refertiDaMostrare.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nessun referto disponibile negli ultimi 30 giorni</p>
            </div>
          ) : (
            <div className="space-y-4">
              {refertiDaMostrare.map((referto) => (
                <div
                  key={referto.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{referto.tipoEsame}</h3>
                        <Badge variant="outline" className="text-xs">
                          {referto.stato}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Laboratorio:</strong> {referto.laboratorio.nome}</p>
                          <p><strong>Data esame:</strong> {format(new Date(referto.dataEsame), "dd/MM/yyyy", { locale: it })}</p>
                          <p><strong>Data risultato:</strong> {format(new Date(referto.dataRisultato), "dd/MM/yyyy", { locale: it })}</p>
                        </div>
                        
                        <div>
                          {referto.prescrizioneAnalisi?.codiceNre && (
                            <p><strong>Codice NRE:</strong> {referto.prescrizioneAnalisi.codiceNre}</p>
                          )}
                          {referto.prescrizioneAnalisi?.medico && (
                            <p><strong>Medico:</strong> Dr. {referto.prescrizioneAnalisi.medico.nome} {referto.prescrizioneAnalisi.medico.cognome}</p>
                          )}
                        </div>
                      </div>

                      {referto.refertoMedico && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <p className="text-sm"><strong>Note mediche:</strong></p>
                          <p className="text-sm text-gray-700">{referto.refertoMedico}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setRefertoSelezionato(referto)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Visualizza
                      </Button>
                      
                      {referto.refertoUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={referto.refertoUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal per visualizzare dettagli referto */}
      <Dialog open={!!refertoSelezionato} onOpenChange={() => setRefertoSelezionato(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Dettagli Referto: {refertoSelezionato?.tipoEsame}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRefertoSelezionato(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {refertoSelezionato && (
            <div className="space-y-6">
              {/* Informazioni generali */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informazioni Esame</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <strong>Tipo esame:</strong> {refertoSelezionato.tipoEsame}
                    </div>
                    <div>
                      <strong>Data esame:</strong> {format(new Date(refertoSelezionato.dataEsame), "dd/MM/yyyy", { locale: it })}
                    </div>
                    <div>
                      <strong>Data risultato:</strong> {format(new Date(refertoSelezionato.dataRisultato), "dd/MM/yyyy", { locale: it })}
                    </div>
                    <div>
                      <strong>Stato:</strong> 
                      <Badge variant="outline" className="ml-2">
                        {refertoSelezionato.stato}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Laboratorio e Prescrizione</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <strong>Laboratorio:</strong> {refertoSelezionato.laboratorio.nome}
                    </div>
                    {refertoSelezionato.laboratorio.indirizzo && (
                      <div>
                        <strong>Indirizzo:</strong> {refertoSelezionato.laboratorio.indirizzo}
                      </div>
                    )}
                    {refertoSelezionato.prescrizioneAnalisi?.codiceNre && (
                      <div>
                        <strong>Codice NRE:</strong> {refertoSelezionato.prescrizioneAnalisi.codiceNre}
                      </div>
                    )}
                    {refertoSelezionato.prescrizioneAnalisi?.medico && (
                      <div>
                        <strong>Medico prescrittore:</strong> Dr. {refertoSelezionato.prescrizioneAnalisi.medico.nome} {refertoSelezionato.prescrizioneAnalisi.medico.cognome}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Risultati analisi */}
              {refertoSelezionato.risultatiJson && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Risultati Analisi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(refertoSelezionato.risultatiJson).map(([parametro, dati]: [string, any]) => (
                        <div key={parametro} className="border rounded-lg p-3">
                          <div className="font-medium text-sm text-gray-600 mb-1">
                            {parametro.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">
                              {dati.valore} {dati.unita}
                            </span>
                            <Badge 
                              variant={dati.normale ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {dati.normale ? "Normale" : "Anomalo"}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Range: {dati.range_normale}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Referto medico */}
              {refertoSelezionato.refertoMedico && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Referto Medico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-gray-800">{refertoSelezionato.refertoMedico}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Azioni */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                {refertoSelezionato.refertoUrl && (
                  <Button variant="outline" asChild>
                    <a href={refertoSelezionato.refertoUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Scarica PDF
                    </a>
                  </Button>
                )}
                <Button onClick={() => setRefertoSelezionato(null)}>
                  Chiudi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}