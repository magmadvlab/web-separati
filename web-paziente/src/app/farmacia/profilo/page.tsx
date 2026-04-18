"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loading } from "@/components/shared/Loading";
import { toast } from "sonner";
import type { Farmacia } from "@/types/api";

export default function FarmaciaProfiloPage() {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<Farmacia>({
    queryKey: ["farmacia-profile"],
    queryFn: async () => {
      const response = await api.get("/farmacia/profile");
      return response.data;
    },
  });

  const [formData, setFormData] = useState<Partial<Farmacia>>({});

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Farmacia>) => {
      const response = await api.put("/farmacia/profile", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmacia-profile"] });
      setIsEditing(false);
      toast.success("Profilo aggiornato con successo");
    },
    onError: () => {
      toast.error("Errore nell'aggiornamento del profilo");
    },
  });

  const handleEdit = () => {
    setFormData(profile || {});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({});
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof Farmacia, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!profile) {
    return <div>Profilo non trovato</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Profilo Farmacia</h1>
          <p className="text-gray-600 mt-2">
            Gestisci le informazioni della tua farmacia
          </p>
        </div>
        {!isEditing && (
          <Button onClick={handleEdit}>Modifica Profilo</Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Generali</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                I dati identificativi possono essere modificati solo dall&apos;amministratore
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome Farmacia</Label>
                  <Input value={profile.nome || ""} disabled className="bg-gray-50" />
                </div>
                <div>
                  <Label>Partita IVA</Label>
                  <Input value={profile.partitaIva || ""} disabled className="bg-gray-50" />
                </div>
                {profile.codiceFarmacia && (
                  <div>
                    <Label>Codice Farmacia</Label>
                    <Input value={profile.codiceFarmacia || ""} disabled className="bg-gray-50" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indirizzo</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                L&apos;indirizzo può essere modificato solo dall&apos;amministratore
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Indirizzo Completo</Label>
                <Input 
                  value={`${profile.indirizzo}, ${profile.citta} ${profile.cap} (${profile.provincia})`} 
                  disabled 
                  className="bg-gray-50" 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contatti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono || ""}
                    onChange={(e) => handleChange("telefono", e.target.value)}
                    placeholder="+39 02 1234567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="info@farmacia.it"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Servizi e Operatività</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consegnaAttiva"
                  checked={formData.consegnaAttiva ?? false}
                  onCheckedChange={(checked) => handleChange("consegnaAttiva", checked)}
                />
                <div>
                  <Label htmlFor="consegnaAttiva">Consegna a Domicilio</Label>
                  <p className="text-sm text-gray-500">Abilita il servizio di consegna</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ritiroAttivo"
                  checked={formData.ritiroAttivo ?? false}
                  onCheckedChange={(checked) => handleChange("ritiroAttivo", checked)}
                />
                <div>
                  <Label htmlFor="ritiroAttivo">Ritiro in Farmacia</Label>
                  <p className="text-sm text-gray-500">Abilita il ritiro in sede</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="preparazioneRapida"
                  checked={formData.preparazioneRapida ?? false}
                  onCheckedChange={(checked) => handleChange("preparazioneRapida", checked)}
                />
                <div>
                  <Label htmlFor="preparazioneRapida">Preparazione Rapida</Label>
                  <p className="text-sm text-gray-500">Preparazione in meno di 2 ore</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="servizio24h"
                  checked={formData.servizio24h ?? false}
                  onCheckedChange={(checked) => handleChange("servizio24h", checked)}
                />
                <div>
                  <Label htmlFor="servizio24h">Servizio 24h</Label>
                  <p className="text-sm text-gray-500">Disponibile 24 ore su 24</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="turnoNotturno"
                  checked={formData.turnoNotturno ?? false}
                  onCheckedChange={(checked) => handleChange("turnoNotturno", checked)}
                />
                <div>
                  <Label htmlFor="turnoNotturno">Turno Notturno</Label>
                  <p className="text-sm text-gray-500">Servizio notturno attivo</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxOrdiniGiornalieri">Max Ordini Giornalieri</Label>
                  <Input
                    id="maxOrdiniGiornalieri"
                    type="number"
                    value={formData.maxOrdiniGiornalieri || ""}
                    onChange={(e) => handleChange("maxOrdiniGiornalieri", parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="tempoMedioPreparazione">Tempo Medio Preparazione (min)</Label>
                  <Input
                    id="tempoMedioPreparazione"
                    type="number"
                    value={formData.tempoMedioPreparazione || ""}
                    onChange={(e) => handleChange("tempoMedioPreparazione", parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifiche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notificheEmail"
                  checked={formData.notificheEmail ?? false}
                  onCheckedChange={(checked) => handleChange("notificheEmail", checked)}
                />
                <Label htmlFor="notificheEmail">Notifiche Email</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notificheSms"
                  checked={formData.notificheSms ?? false}
                  onCheckedChange={(checked) => handleChange("notificheSms", checked)}
                />
                <Label htmlFor="notificheSms">Notifiche SMS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifichePush"
                  checked={formData.notifichePush ?? false}
                  onCheckedChange={(checked) => handleChange("notifichePush", checked)}
                />
                <Label htmlFor="notifichePush">Notifiche Push</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Annulla
            </Button>
          </div>
        </form>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Generali</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Nome</p>
                  <p className="text-lg">{profile.nome}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Partita IVA</p>
                  <p className="text-lg">{profile.partitaIva}</p>
                </div>
                {profile.codiceFarmacia && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Codice Farmacia</p>
                    <p className="text-lg">{profile.codiceFarmacia}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indirizzo e Contatti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Indirizzo</p>
                <p className="text-lg">
                  {profile.indirizzo}, {profile.citta} {profile.cap} ({profile.provincia})
                </p>
              </div>
              {profile.telefono && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Telefono</p>
                  <p className="text-lg">{profile.telefono}</p>
                </div>
              )}
              {profile.email && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg">{profile.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Servizi Attivi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Consegna a Domicilio</span>
                <span className={profile.consegnaAttiva ? "text-green-600" : "text-gray-400"}>
                  {profile.consegnaAttiva ? "✓ Attivo" : "✗ Non attivo"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ritiro in Farmacia</span>
                <span className={profile.ritiroAttivo ? "text-green-600" : "text-gray-400"}>
                  {profile.ritiroAttivo ? "✓ Attivo" : "✗ Non attivo"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Preparazione Rapida</span>
                <span className={profile.preparazioneRapida ? "text-green-600" : "text-gray-400"}>
                  {profile.preparazioneRapida ? "✓ Attivo" : "✗ Non attivo"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Servizio 24h</span>
                <span className={profile.servizio24h ? "text-green-600" : "text-gray-400"}>
                  {profile.servizio24h ? "✓ Attivo" : "✗ Non attivo"}
                </span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

