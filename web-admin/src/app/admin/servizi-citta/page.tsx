"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/shared/Loading";
import { 
  MapPin, 
  Plus, 
  Building2,
  Stethoscope,
  FlaskConical,
  ArrowLeft,
  Users,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { AddMedicoForm } from "@/components/admin/AddMedicoForm";
import { AddFarmaciaForm } from "@/components/admin/AddFarmaciaForm";
import { AddLaboratorioForm } from "@/components/admin/AddLaboratorioForm";

interface Citta {
  id: number;
  nome: string;
  regione: string;
  provincia: string;
  attiva: boolean;
}

export default function AdminServiziCittaPage() {
  const [selectedCitta, setSelectedCitta] = useState<number | null>(null);
  const [showAddMedico, setShowAddMedico] = useState(false);
  const [showAddFarmacia, setShowAddFarmacia] = useState(false);
  const [showAddLaboratorio, setShowAddLaboratorio] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch città
  const { data: citta, isLoading: cittaLoading } = useQuery({
    queryKey: ["admin-citta"],
    queryFn: async () => {
      const response = await api.get("/admin/citta");
      return response.data.data as Citta[];
    },
  });

  // Fetch servizi per città selezionata
  const { data: servizi, isLoading: serviziLoading } = useQuery({
    queryKey: ["admin-servizi-citta", selectedCitta],
    queryFn: async () => {
      if (!selectedCitta) return null;
      const response = await api.get(`/admin/citta/${selectedCitta}/servizi`);
      return response.data.data;
    },
    enabled: !!selectedCitta,
  });

  if (cittaLoading) return <Loading />;

  const cittaSelezionata = citta?.find(c => c.id === selectedCitta);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gestione Servizi per Città</h1>
            <p className="text-gray-600 mt-2">
              Aggiungi e gestisci medici, farmacie e laboratori per ogni città
            </p>
          </div>
        </div>
      </div>

      {/* Selezione Città */}
      <Card>
        <CardHeader>
          <CardTitle>Seleziona Città</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedCitta?.toString()} 
            onValueChange={(value) => setSelectedCitta(Number(value))}
          >
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue placeholder="Seleziona una città..." />
            </SelectTrigger>
            <SelectContent>
              {citta?.map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {c.nome} ({c.provincia}) - {c.regione}
                    {c.attiva && <Badge variant="outline" className="ml-2">Attiva</Badge>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Contenuto per città selezionata */}
      {selectedCitta && cittaSelezionata && (
        <>
          {/* Statistiche */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Medici</CardTitle>
                <Stethoscope className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {servizi?.medici?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Medici registrati</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Farmacie</CardTitle>
                <Building2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {servizi?.farmacie?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Farmacie attive</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Laboratori</CardTitle>
                <FlaskConical className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {servizi?.laboratori?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Laboratori operativi</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs per gestione servizi */}
          <Tabs defaultValue="medici" className="space-y-4">
            <TabsList>
              <TabsTrigger value="medici">Medici</TabsTrigger>
              <TabsTrigger value="farmacie">Farmacie</TabsTrigger>
              <TabsTrigger value="laboratori">Laboratori</TabsTrigger>
            </TabsList>

            {/* Tab Medici */}
            <TabsContent value="medici" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Medici a {cittaSelezionata.nome}</h2>
                <Button onClick={() => setShowAddMedico(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Medico
                </Button>
              </div>
              
              {serviziLoading ? (
                <Loading />
              ) : servizi?.medici?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {servizi.medici.map((medico: any) => (
                    <Card key={medico.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Dr. {medico.nome} {medico.cognome}
                        </CardTitle>
                        <p className="text-sm text-gray-500">{medico.tipoMedico}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Codice:</strong> {medico.codiceRegionale}</p>
                          <p><strong>Email:</strong> {medico.email}</p>
                          <p><strong>Telefono:</strong> {medico.telefono || "N/D"}</p>
                          {medico._count && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                              <Users className="h-4 w-4" />
                              <span>{medico._count.pazienti || 0} pazienti</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Stethoscope className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-600">Nessun medico registrato</p>
                    <p className="text-sm text-gray-500 mb-4">Aggiungi il primo medico per questa città</p>
                    <Button onClick={() => setShowAddMedico(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Medico
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Farmacie */}
            <TabsContent value="farmacie" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Farmacie a {cittaSelezionata.nome}</h2>
                <Button onClick={() => setShowAddFarmacia(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Farmacia
                </Button>
              </div>
              
              {serviziLoading ? (
                <Loading />
              ) : servizi?.farmacie?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {servizi.farmacie.map((farmacia: any) => (
                    <Card key={farmacia.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{farmacia.nome}</CardTitle>
                        <p className="text-sm text-gray-500">P.IVA: {farmacia.partitaIva}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Indirizzo:</strong> {farmacia.indirizzo}</p>
                          <p><strong>CAP:</strong> {farmacia.cap}</p>
                          <p><strong>Telefono:</strong> {farmacia.telefono || "N/D"}</p>
                          <p><strong>Email:</strong> {farmacia.email}</p>
                          <Badge variant={farmacia.attiva ? "default" : "secondary"} className="mt-2">
                            {farmacia.attiva ? "Attiva" : "Inattiva"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-600">Nessuna farmacia registrata</p>
                    <p className="text-sm text-gray-500 mb-4">Aggiungi la prima farmacia per questa città</p>
                    <Button onClick={() => setShowAddFarmacia(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Farmacia
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Laboratori */}
            <TabsContent value="laboratori" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Laboratori a {cittaSelezionata.nome}</h2>
                <Button onClick={() => setShowAddLaboratorio(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Laboratorio
                </Button>
              </div>
              
              {serviziLoading ? (
                <Loading />
              ) : servizi?.laboratori?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {servizi.laboratori.map((lab: any) => (
                    <Card key={lab.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{lab.nome}</CardTitle>
                        <p className="text-sm text-gray-500">P.IVA: {lab.partitaIva}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p><strong>Indirizzo:</strong> {lab.indirizzo}</p>
                          <p><strong>CAP:</strong> {lab.cap}</p>
                          <p><strong>Telefono:</strong> {lab.telefono || "N/D"}</p>
                          <p><strong>Email:</strong> {lab.email}</p>
                          <Badge variant={lab.attivo ? "default" : "secondary"} className="mt-2">
                            {lab.attivo ? "Attivo" : "Inattivo"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FlaskConical className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-600">Nessun laboratorio registrato</p>
                    <p className="text-sm text-gray-500 mb-4">Aggiungi il primo laboratorio per questa città</p>
                    <Button onClick={() => setShowAddLaboratorio(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Laboratorio
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Dialog Aggiungi Medico */}
      <Dialog open={showAddMedico} onOpenChange={setShowAddMedico}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aggiungi Medico a {cittaSelezionata?.nome}</DialogTitle>
          </DialogHeader>
          {selectedCitta !== null && (
            <AddMedicoForm
              cittaId={selectedCitta}
              onSuccess={() => setShowAddMedico(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Aggiungi Farmacia */}
      <Dialog open={showAddFarmacia} onOpenChange={setShowAddFarmacia}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aggiungi Farmacia a {cittaSelezionata?.nome}</DialogTitle>
          </DialogHeader>
          {selectedCitta !== null && (
            <AddFarmaciaForm
              cittaId={selectedCitta}
              onSuccess={() => setShowAddFarmacia(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Aggiungi Laboratorio */}
      <Dialog open={showAddLaboratorio} onOpenChange={setShowAddLaboratorio}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aggiungi Laboratorio a {cittaSelezionata?.nome}</DialogTitle>
          </DialogHeader>
          {selectedCitta !== null && (
            <AddLaboratorioForm
              cittaId={selectedCitta}
              onSuccess={() => setShowAddLaboratorio(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
