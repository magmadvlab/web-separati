"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, MapPin, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Profilo {
  nome: string;
  cognome: string;
  codiceFiscale: string;
  dataNascita: string;
  telefono: string;
  emailPersonale: string;
  indirizzo: string;
  citta: string;
  cap: string;
  provincia: string;
}

export default function ProfiloPage() {
  const { token } = useAuthStore();
  const { toast } = useToast();
  const [profilo, setProfilo] = useState<Profilo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfilo();
  }, []);

  const fetchProfilo = async () => {
    try {
      const response = await api.get("/paziente/profile");
      setProfilo(response.data);
    } catch (error) {
      console.error("Errore caricamento profilo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profilo) return;

    setSaving(true);
    try {
      await api.put("/paziente/profile", profilo);
      toast({
        title: "Profilo aggiornato",
        description: "Le modifiche sono state salvate con successo",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  if (!profilo) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600">Impossibile caricare il profilo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Il Mio Profilo</h1>
        <p className="text-gray-600 mt-2">
          Gestisci le tue informazioni personali
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informazioni Personali
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={profilo.nome || ""}
                onChange={(e) => setProfilo({ ...profilo, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cognome">Cognome</Label>
              <Input
                id="cognome"
                value={profilo.cognome || ""}
                onChange={(e) => setProfilo({ ...profilo, cognome: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codiceFiscale">Codice Fiscale</Label>
              <Input
                id="codiceFiscale"
                value={profilo.codiceFiscale || ""}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataNascita">Data di Nascita</Label>
              <Input
                id="dataNascita"
                type="date"
                value={profilo.dataNascita?.split('T')[0] || ""}
                onChange={(e) => setProfilo({ ...profilo, dataNascita: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contatti
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="telefono">Telefono</Label>
            <Input
              id="telefono"
              value={profilo.telefono || ""}
              onChange={(e) => setProfilo({ ...profilo, telefono: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Personale</Label>
            <Input
              id="email"
              type="email"
              value={profilo.emailPersonale || ""}
              onChange={(e) => setProfilo({ ...profilo, emailPersonale: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Indirizzo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="indirizzo">Via e Numero Civico</Label>
            <Input
              id="indirizzo"
              value={profilo.indirizzo || ""}
              onChange={(e) => setProfilo({ ...profilo, indirizzo: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="citta">Città</Label>
              <Input
                id="citta"
                value={profilo.citta || ""}
                onChange={(e) => setProfilo({ ...profilo, citta: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cap">CAP</Label>
              <Input
                id="cap"
                value={profilo.cap || ""}
                onChange={(e) => setProfilo({ ...profilo, cap: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia</Label>
              <Input
                id="provincia"
                value={profilo.provincia || ""}
                maxLength={2}
                onChange={(e) => setProfilo({ ...profilo, provincia: e.target.value.toUpperCase() })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvataggio..." : "Salva Modifiche"}
        </Button>
      </div>
    </div>
  );
}
