"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, User, Calendar, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/shared/Loading";

interface Delega {
  id: number;
  caregiverId: number;
  caregiverNome: string;
  caregiverCognome: string;
  caregiverEmail: string;
  permessi: string[];
  dataInizio: string;
  dataFine?: string;
  stato: string;
}

export function DelegheManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailCaregiver, setEmailCaregiver] = useState("");
  const [permessi, setPermessi] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carica deleghe attive
  const { data: deleghe, isLoading } = useQuery({
    queryKey: ["deleghe"],
    queryFn: async () => {
      const response = await api.get("/deleghe");
      return response.data;
    },
  });

  // Crea delega
  const creaDelegaMutation = useMutation({
    mutationFn: async (data: { emailCaregiver: string; permessi: string[]; dataFine?: string }) => {
      const response = await api.post("/deleghe", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleghe"] });
      setIsDialogOpen(false);
      setEmailCaregiver("");
      setPermessi([]);
      toast({
        title: "Delega creata",
        description: "La delega è stata creata con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nella creazione della delega",
        variant: "destructive",
      });
    },
  });

  // Revoca delega
  const revocaDelegaMutation = useMutation({
    mutationFn: async (delegaId: number) => {
      const response = await api.delete(`/deleghe/${delegaId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deleghe"] });
      toast({
        title: "Delega revocata",
        description: "La delega è stata revocata con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nella revoca della delega",
        variant: "destructive",
      });
    },
  });

  const handleTogglePermesso = (permesso: string) => {
    setPermessi((prev) =>
      prev.includes(permesso)
        ? prev.filter((p) => p !== permesso)
        : [...prev, permesso]
    );
  };

  const handleCreaDelega = () => {
    if (!emailCaregiver.trim() || permessi.length === 0) {
      toast({
        title: "Errore",
        description: "Inserisci email caregiver e seleziona almeno un permesso",
        variant: "destructive",
      });
      return;
    }
    creaDelegaMutation.mutate({ emailCaregiver, permessi });
  };

  if (isLoading) {
    return <Loading />;
  }

  const delegheAttive: Delega[] = deleghe || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestione Deleghe</h2>
          <p className="text-gray-600 mt-1">
            Gestisci i permessi per caregiver e familiari
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuova Delega
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crea Nuova Delega</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Caregiver</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailCaregiver}
                  onChange={(e) => setEmailCaregiver(e.target.value)}
                  placeholder="caregiver@example.com"
                />
              </div>
              <div>
                <Label>Permessi</Label>
                <div className="space-y-2 mt-2">
                  {["ordini", "terapia", "comunicazione"].map((permesso) => (
                    <div key={permesso} className="flex items-center space-x-2">
                      <Checkbox
                        id={permesso}
                        checked={permessi.includes(permesso)}
                        onCheckedChange={() => handleTogglePermesso(permesso)}
                      />
                      <Label htmlFor={permesso} className="capitalize cursor-pointer">
                        {permesso === "ordini" && "Gestione Ordini"}
                        {permesso === "terapia" && "Gestione Terapia"}
                        {permesso === "comunicazione" && "Comunicazione con Medico"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={handleCreaDelega}
                disabled={creaDelegaMutation.isPending}
                className="w-full"
              >
                Crea Delega
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {delegheAttive.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Nessuna delega attiva</p>
            <p className="text-sm text-gray-400 mt-2">
              Crea una delega per permettere a un caregiver di gestire il tuo account
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {delegheAttive.map((delega) => (
            <Card key={delega.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {delega.caregiverNome} {delega.caregiverCognome}
                      </h3>
                      <p className="text-sm text-gray-600">{delega.caregiverEmail}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {delega.permessi.map((permesso) => (
                          <Badge key={permesso} variant="secondary" className="capitalize">
                            {permesso === "ordini" && "Ordini"}
                            {permesso === "terapia" && "Terapia"}
                            {permesso === "comunicazione" && "Comunicazione"}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Dal {new Date(delega.dataInizio).toLocaleDateString("it-IT")}
                        </span>
                        {delega.dataFine && (
                          <span className="flex items-center gap-1">
                            Al {new Date(delega.dataFine).toLocaleDateString("it-IT")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => revocaDelegaMutation.mutate(delega.id)}
                    disabled={revocaDelegaMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


