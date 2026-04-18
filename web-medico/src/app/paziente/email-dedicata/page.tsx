"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Mail, QrCode, Copy, Check, Share2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/shared/Loading";
import Image from "next/image";

export default function EmailDedicataPage() {
  const [copied, setCopied] = useState(false);
  const [selectedMedicoId, setSelectedMedicoId] = useState<number | null>(null);
  const { toast } = useToast();

  // Carica email dedicata
  const { data: emailData, isLoading } = useQuery({
    queryKey: ["email-dedicata"],
    queryFn: async () => {
      const response = await api.get("/paziente/email-dedicata");
      return response.data;
    },
  });

  // Carica lista medici
  const { data: medici } = useQuery({
    queryKey: ["medici"],
    queryFn: async () => {
      const response = await api.get("/paziente/medici");
      return response.data;
    },
  });

  // Condividi con medico
  const condividiMutation = useMutation({
    mutationFn: async (medicoId: number) => {
      const response = await api.post(`/paziente/email-dedicata/condividi-medico/${medicoId}`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Email condivisa",
        description: "L'email dedicata è stata inviata al medico.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nella condivisione",
        variant: "destructive",
      });
    },
  });

  const handleCopy = () => {
    if (emailData?.emailDedicata) {
      navigator.clipboard.writeText(emailData.emailDedicata);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Email copiata",
        description: "L'email è stata copiata negli appunti.",
      });
    }
  };

  const qrCodeUrl = emailData?.emailDedicata
    ? `/api/paziente/email-dedicata/qrcode`
    : null;

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Email Dedicata RicettaZero</h1>
        <p className="text-gray-600 mt-2">
          Condividi questa email con il tuo medico per ricevere prescrizioni automaticamente
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email e QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              La Tua Email Dedicata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Indirizzo Email
              </label>
              <div className="flex gap-2">
                <Input
                  value={emailData?.emailDedicata || ""}
                  readOnly
                  className="font-mono"
                />
                <Button onClick={handleCopy} variant="outline">
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {qrCodeUrl && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  QR Code
                </label>
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code Email Dedicata"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Scansiona con il telefono per configurare l'email nel sistema del medico
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Condivisione con Medico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Condividi con Medico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Seleziona il medico con cui condividere l'email dedicata. Riceverà un'email con
              le istruzioni per inviare prescrizioni.
            </p>

            {medici && medici.length > 0 ? (
              <div className="space-y-2">
                {medici.map((medico: any) => (
                  <div
                    key={medico.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        Dott. {medico.nome} {medico.cognome}
                      </p>
                      <p className="text-sm text-gray-500">{medico.email}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => condividiMutation.mutate(medico.id)}
                      disabled={condividiMutation.isPending}
                    >
                      Condividi
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Nessun medico associato
              </p>
            )}
          </CardContent>
        </Card>

        {/* Guida Rapida */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Guida Rapida per Segreteria/Ambulatorio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Istruzioni Passo-Passo</h3>
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>
                    <strong>Copiare l'indirizzo email dedicato</strong> sopra indicato o scansionare il QR code
                  </li>
                  <li>
                    <strong>Configurare nel sistema di prescrizione</strong> l'email come destinatario
                    aggiuntivo per le prescrizioni del paziente
                  </li>
                  <li>
                    <strong>Inviare la prescrizione</strong> all'email dedicata come allegato PDF
                    (formato standard prescrizione elettronica)
                  </li>
                  <li>
                    <strong>Il paziente riceverà automaticamente</strong> la prescrizione nella sua app RicettaZero
                  </li>
                </ol>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Nota Importante:</strong> Non è necessario modificare il sistema di prescrizione esistente.
                  Basta aggiungere questa email come destinatario aggiuntivo (CC o BCC).
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Il sistema RicettaZero processerà automaticamente l'email e creerà la prescrizione
                  nell'account del paziente.
                </p>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Template Email Consigliato</h4>
                <div className="bg-white p-3 rounded border font-mono text-xs">
                  <p><strong>Destinatario:</strong> {emailData?.emailDedicata || "[email dedicata]"}</p>
                  <p><strong>Oggetto:</strong> Prescrizione - [Nome Paziente]</p>
                  <p><strong>Allegato:</strong> prescrizione.pdf</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Puoi copiare questo template e utilizzarlo nel tuo sistema di prescrizione.
                </p>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Supporto:</strong> Per assistenza nella configurazione, contattare il supporto RicettaZero
                  o consultare la sezione FAQ.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

