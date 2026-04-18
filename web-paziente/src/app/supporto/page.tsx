"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle, MessageSquare, Search, Phone, FileText, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Loading } from "@/components/shared/Loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Ticket {
  id: number;
  tipo: string;
  oggetto: string;
  descrizione: string;
  stato: string;
  priorita: string;
  dataApertura: string;
}

export default function SupportoPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [nuovoTicket, setNuovoTicket] = useState({
    tipo: "GENERALE",
    oggetto: "",
    descrizione: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Carica ticket
  const { data: ticket, isLoading } = useQuery({
    queryKey: ["supporto", "ticket"],
    queryFn: async () => {
      const response = await api.get("/paziente/supporto/ticket");
      return response.data;
    },
  });

  // Carica FAQ
  const { data: faq } = useQuery({
    queryKey: ["supporto", "faq"],
    queryFn: async () => {
      const response = await api.get("/supporto/faq");
      return response.data;
    },
  });

  // Cerca FAQ
  const { data: faqCercate } = useQuery({
    queryKey: ["supporto", "faq", "cerca", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await api.get(`/supporto/faq/cerca?q=${encodeURIComponent(searchQuery)}`);
      return response.data;
    },
    enabled: searchQuery.trim().length > 0,
  });

  // Crea ticket
  const creaTicketMutation = useMutation({
    mutationFn: async (data: typeof nuovoTicket) => {
      const response = await api.post("/paziente/supporto/ticket", {
        oggetto: data.oggetto,
        descrizione: data.descrizione,
        categoria: data.tipo,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supporto", "ticket"] });
      setIsDialogOpen(false);
      setNuovoTicket({ tipo: "GENERALE", oggetto: "", descrizione: "" });
      toast({
        title: "Ticket creato",
        description: "Il tuo ticket è stato creato con successo.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.response?.data?.message || "Errore nella creazione del ticket",
        variant: "destructive",
      });
    },
  });

  const handleCreaTicket = () => {
    if (!nuovoTicket.oggetto.trim() || !nuovoTicket.descrizione.trim()) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive",
      });
      return;
    }
    creaTicketMutation.mutate(nuovoTicket);
  };

  const getStatoBadge = (stato: string) => {
    switch (stato) {
      case "APERTO":
        return <Badge variant="outline">Aperto</Badge>;
      case "IN_LAVORAZIONE":
        return <Badge className="bg-blue-500">In Lavorazione</Badge>;
      case "RISOLTO":
        return <Badge className="bg-green-500">Risolto</Badge>;
      case "CHIUSO":
        return <Badge variant="secondary">Chiuso</Badge>;
      default:
        return <Badge>{stato}</Badge>;
    }
  };

  const getPrioritaBadge = (priorita: string) => {
    switch (priorita) {
      case "URGENTE":
        return <Badge variant="destructive">Urgente</Badge>;
      case "ALTA":
        return <Badge className="bg-orange-500">Alta</Badge>;
      case "MEDIA":
        return <Badge className="bg-yellow-500">Media</Badge>;
      case "BASSA":
        return <Badge variant="outline">Bassa</Badge>;
      default:
        return <Badge>{priorita}</Badge>;
    }
  };

  const ticketList: Ticket[] = ticket || [];
  const faqList = faq || [];
  const faqCercateList = faqCercate || [];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Supporto</h1>
        <p className="text-gray-600 mt-2">
          Hai bisogno di aiuto? Contattaci o consulta le FAQ
        </p>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="ticket">I Miei Ticket</TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Cerca nelle FAQ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Cerca una domanda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {searchQuery.trim() ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Risultati Ricerca</h2>
              {faqCercateList.length > 0 ? (
                faqCercateList.map((item: any) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{item.domanda}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{item.risposta}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    Nessun risultato trovato
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Domande Frequenti</h2>
              {faqList.length > 0 ? (
                faqList.map((item: any) => (
                  <Card key={item.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{item.domanda}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">{item.risposta}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-gray-500">
                    Nessuna FAQ disponibile
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Ticket Tab */}
        <TabsContent value="ticket" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">I Miei Ticket</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuovo Ticket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crea Nuovo Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={nuovoTicket.tipo}
                      onValueChange={(value) => setNuovoTicket({ ...nuovoTicket, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TECNICO">Tecnico</SelectItem>
                        <SelectItem value="FATTURAZIONE">Fatturazione</SelectItem>
                        <SelectItem value="GENERALE">Generale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="oggetto">Oggetto</Label>
                    <Input
                      id="oggetto"
                      value={nuovoTicket.oggetto}
                      onChange={(e) => setNuovoTicket({ ...nuovoTicket, oggetto: e.target.value })}
                      placeholder="Oggetto del ticket"
                    />
                  </div>
                  <div>
                    <Label htmlFor="descrizione">Descrizione</Label>
                    <Textarea
                      id="descrizione"
                      value={nuovoTicket.descrizione}
                      onChange={(e) => setNuovoTicket({ ...nuovoTicket, descrizione: e.target.value })}
                      placeholder="Descrivi il problema..."
                      rows={5}
                    />
                  </div>
                  <Button onClick={handleCreaTicket} disabled={creaTicketMutation.isPending} className="w-full">
                    Crea Ticket
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <Loading />
          ) : ticketList.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Nessun ticket aperto</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {ticketList.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{ticket.oggetto}</h3>
                          {getStatoBadge(ticket.stato)}
                          {getPrioritaBadge(ticket.priorita)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{ticket.descrizione}</p>
                        <p className="text-xs text-gray-500">
                          Aperto il {new Date(ticket.dataApertura).toLocaleDateString("it-IT")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


