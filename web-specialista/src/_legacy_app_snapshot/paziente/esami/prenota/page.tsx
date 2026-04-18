"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loading } from "@/components/shared/Loading";
import { useToast } from "@/hooks/use-toast";
import type { ApiResponse } from "@/types/api";
import { Search, MapPin, Building2, Euro } from "lucide-react";
import Link from "next/link";

interface Laboratorio {
  id: number;
  nome: string;
  indirizzo: string;
  citta: string;
  provincia: string;
  convenzionato: boolean;
  servizi: Array<{
    id: number;
    nome: string;
    tipoServizio: string;
    tipoPagamento: string;
    prezzoBase?: number;
    prezzoConvenzionato?: number;
  }>;
}

export default function PrenotaEsamePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tipoServizio, setTipoServizio] = useState("");
  const [citta, setCitta] = useState("");
  const [provincia, setProvincia] = useState("");
  const [convenzionato, setConvenzionato] = useState<string>("all");
  const [tipoPagamento, setTipoPagamento] = useState<string>("all");

  const { data: laboratori, isLoading, refetch } = useQuery<Laboratorio[]>({
    queryKey: ["laboratori", tipoServizio, citta, provincia, convenzionato, tipoPagamento],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tipoServizio) params.append("tipoServizio", tipoServizio);
      if (citta) params.append("citta", citta);
      if (provincia) params.append("provincia", provincia);
      if (convenzionato && convenzionato !== "all") params.append("convenzionato", convenzionato);
      if (tipoPagamento && tipoPagamento !== "all") params.append("tipoPagamento", tipoPagamento);

      const response = await api.get<ApiResponse<Laboratorio[]>>(
        `/salute/laboratori?${params.toString()}`
      );
      return response.data.data || [];
    },
    enabled: !!tipoServizio,
  });

  const handleSearch = () => {
    if (!tipoServizio) {
      toast({
        title: "Errore",
        description: "Seleziona un tipo di servizio",
        variant: "destructive",
      });
      return;
    }
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Prenota Esame</h1>
        <Link href="/paziente/esami/prenotazioni" className="text-sm text-blue-600 hover:underline">
          Le mie prenotazioni
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ricerca Laboratori</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tipoServizio">Tipo Servizio *</Label>
              <Select value={tipoServizio} onValueChange={setTipoServizio}>
                <SelectTrigger id="tipoServizio">
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="esame_sangue">Esami del Sangue</SelectItem>
                  <SelectItem value="radiografia">Radiografia</SelectItem>
                  <SelectItem value="risonanza">Risonanza Magnetica</SelectItem>
                  <SelectItem value="ecografia">Ecografia</SelectItem>
                  <SelectItem value="ecg">ECG</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="citta">Città</Label>
              <Input
                id="citta"
                placeholder="Es. Milano"
                value={citta}
                onChange={(e) => setCitta(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia</Label>
              <Input
                id="provincia"
                placeholder="Es. MI"
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="convenzionato">Convenzionato</Label>
              <Select value={convenzionato} onValueChange={setConvenzionato}>
                <SelectTrigger id="convenzionato">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="true">Sì</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoPagamento">Tipo Pagamento</Label>
              <Select value={tipoPagamento} onValueChange={setTipoPagamento}>
                <SelectTrigger id="tipoPagamento">
                  <SelectValue placeholder="Tutti" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="SSN">SSN</SelectItem>
                  <SelectItem value="privato">Privato</SelectItem>
                  <SelectItem value="misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSearch} className="w-full md:w-auto">
            <Search className="h-4 w-4 mr-2" />
            Cerca
          </Button>
        </CardContent>
      </Card>

      {isLoading && <Loading />}

      {laboratori && laboratori.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Laboratori Disponibili ({laboratori.length})</h2>
          {laboratori.map((laboratorio) => (
            <Card key={laboratorio.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">{laboratorio.nome}</h3>
                      {laboratorio.convenzionato && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Convenzionato
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {laboratorio.indirizzo}, {laboratorio.citta} ({laboratorio.provincia})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {laboratorio.servizi.map((servizio) => (
                        <div key={servizio.id} className="flex items-center justify-between text-sm">
                          <span>{servizio.nome}</span>
                          <div className="flex items-center gap-2">
                            {servizio.tipoPagamento === "SSN" && (
                              <span className="text-green-600">SSN</span>
                            )}
                            {servizio.tipoPagamento === "privato" && servizio.prezzoBase && (
                              <span className="flex items-center gap-1">
                                <Euro className="h-3 w-3" />
                                {Number(servizio.prezzoBase).toFixed(2)}
                              </span>
                            )}
                            {servizio.tipoPagamento === "misto" && servizio.prezzoConvenzionato && (
                              <span className="flex items-center gap-1 text-sm">
                                <Euro className="h-3 w-3" />
                                {Number(servizio.prezzoConvenzionato).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/paziente/esami/laboratori/${laboratorio.id}?servizio=${tipoServizio}`)}
                  >
                    Seleziona
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {laboratori && laboratori.length === 0 && tipoServizio && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">Nessun laboratorio trovato</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

