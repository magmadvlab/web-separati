"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle2, Smartphone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/shared/Loading";
import Image from "next/image";

export function MFASetup() {
  const [codiceVerifica, setCodiceVerifica] = useState("");
  const [metodo, setMetodo] = useState<"TOTP" | "SMS">("TOTP");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carica stato MFA
  const { data: mfaStatus, isLoading } = useQuery({
    queryKey: ["mfa", "status"],
    queryFn: async () => {
      const response = await api.get("/mfa/status");
      return response.data;
    },
  });

  // Setup MFA
  const setupMFAMutation = useMutation({
    mutationFn: async (metodo: "TOTP" | "SMS") => {
      const response = await api.post("/mfa/setup", { metodo });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["mfa", "status"] });
      toast({
        title: "MFA configurato",
        description: "Scansiona il QR code o inserisci il codice per completare la configurazione.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nella configurazione MFA",
        variant: "destructive",
      });
    },
  });

  // Verifica MFA
  const verificaMFAMutation = useMutation({
    mutationFn: async (codice: string) => {
      const response = await api.post("/mfa/verifica", { codice });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa", "status"] });
      setCodiceVerifica("");
      toast({
        title: "MFA attivato",
        description: "L'autenticazione a due fattori è stata attivata con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Codice non valido",
        description: error.response?.data?.message || "Il codice inserito non è corretto",
        variant: "destructive",
      });
    },
  });

  // Disabilita MFA
  const disabilitaMFAMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/mfa/disable");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mfa", "status"] });
      toast({
        title: "MFA disabilitato",
        description: "L'autenticazione a due fattori è stata disabilitata.",
      });
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  const mfaAttivo = mfaStatus?.attivo || false;
  const qrCodeUrl = mfaStatus?.qrCodeUrl;
  const secret = mfaStatus?.secret;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Autenticazione a Due Fattori (MFA)
          </CardTitle>
          <CardDescription>
            Aggiungi un livello di sicurezza aggiuntivo al tuo account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {mfaAttivo ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  MFA è attualmente attivo sul tuo account
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">Attivo</Badge>
                <span className="text-sm text-gray-600">
                  Metodo: {mfaStatus?.metodo === "TOTP" ? "App Authenticator" : "SMS"}
                </span>
              </div>
              <Button
                variant="destructive"
                onClick={() => disabilitaMFAMutation.mutate()}
                disabled={disabilitaMFAMutation.isPending}
              >
                Disabilita MFA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Metodo di Autenticazione</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    variant={metodo === "TOTP" ? "default" : "outline"}
                    onClick={() => setMetodo("TOTP")}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    App Authenticator
                  </Button>
                  <Button
                    variant={metodo === "SMS" ? "default" : "outline"}
                    onClick={() => setMetodo("SMS")}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    SMS
                  </Button>
                </div>
              </div>

              {setupMFAMutation.isSuccess && setupMFAMutation.data && (
                <div className="space-y-4">
                  {metodo === "TOTP" && qrCodeUrl && (
                    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Scansiona questo QR code con la tua app:</p>
                      <img src={qrCodeUrl} alt="QR Code MFA" className="w-48 h-48" />
                      {secret && (
                        <p className="text-xs text-gray-500 mt-2 font-mono">
                          Oppure inserisci manualmente: {secret}
                        </p>
                      )}
                    </div>
                  )}

                  {metodo === "SMS" && (
                    <Alert>
                      <AlertDescription>
                        Un codice di verifica è stato inviato al tuo numero di telefono.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="codice">Codice di Verifica</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="codice"
                        value={codiceVerifica}
                        onChange={(e) => setCodiceVerifica(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        className="text-center text-lg tracking-widest"
                      />
                      <Button
                        onClick={() => verificaMFAMutation.mutate(codiceVerifica)}
                        disabled={codiceVerifica.length !== 6 || verificaMFAMutation.isPending}
                      >
                        Verifica
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {!setupMFAMutation.isSuccess && (
                <Button
                  onClick={() => setupMFAMutation.mutate(metodo)}
                  disabled={setupMFAMutation.isPending}
                  className="w-full"
                >
                  Configura MFA
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

