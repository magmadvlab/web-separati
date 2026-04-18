"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface AddLaboratorioFormProps {
  cittaId: number;
  onSuccess: () => void;
}

interface Servizio {
  nome: string;
  codice: string;
  prezzo: string;
  tempoRefertazione: string;
}

export function AddLaboratorioForm({ cittaId, onSuccess }: AddLaboratorioFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    partitaIva: "",
    codiceLaboratorio: "",
    indirizzo: "",
    cap: "",
    provincia: "",
    telefono: "",
    email: "",
  });

  const [servizi, setServizi] = useState<Servizio[]>([]);
  const [showServizi, setShowServizi] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData & { servizi?: Servizio[] }) => {
      // Converti i servizi con i tipi corretti
      const payload = {
        ...data,
        servizi: data.servizi?.map((s) => ({
          nome: s.nome,
          codice: s.codice,
          prezzo: parseFloat(s.prezzo),
          tempoRefertazione: parseInt(s.tempoRefertazione),
        })),
      };
      const response = await api.post(`/admin/citta/${cittaId}/laboratori`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Laboratorio aggiunto con successo!");
      queryClient.invalidateQueries({ queryKey: ["admin-servizi-citta", cittaId] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Errore durante l'aggiunta del laboratorio");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      servizi: servizi.length > 0 ? servizi : undefined,
    };
    mutation.mutate(payload);
  };

  const addServizio = () => {
    setServizi([
      ...servizi,
      {
        nome: "",
        codice: "",
        prezzo: "",
        tempoRefertazione: "24",
      },
    ]);
  };

  const removeServizio = (index: number) => {
    setServizi(servizi.filter((_, i) => i !== index));
  };

  const updateServizio = (index: number, field: keyof Servizio, value: string) => {
    const newServizi = [...servizi];
    newServizi[index] = { ...newServizi[index], [field]: value };
    setServizi(newServizi);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Nome */}
        <div className="space-y-2 col-span-2">
          <Label htmlFor="nome">Nome Laboratorio *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />
        </div>

        {/* Partita IVA */}
        <div className="space-y-2">
          <Label htmlFor="partitaIva">Partita IVA *</Label>
          <Input
            id="partitaIva"
            value={formData.partitaIva}
            onChange={(e) => setFormData({ ...formData, partitaIva: e.target.value })}
            required
          />
        </div>

        {/* Codice Laboratorio */}
        <div className="space-y-2">
          <Label htmlFor="codiceLaboratorio">Codice Laboratorio *</Label>
          <Input
            id="codiceLaboratorio"
            value={formData.codiceLaboratorio}
            onChange={(e) => setFormData({ ...formData, codiceLaboratorio: e.target.value })}
            required
          />
        </div>

        {/* Indirizzo */}
        <div className="space-y-2 col-span-2">
          <Label htmlFor="indirizzo">Indirizzo *</Label>
          <Input
            id="indirizzo"
            value={formData.indirizzo}
            onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
            required
          />
        </div>

        {/* CAP */}
        <div className="space-y-2">
          <Label htmlFor="cap">CAP *</Label>
          <Input
            id="cap"
            value={formData.cap}
            onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
            required
          />
        </div>

        {/* Provincia */}
        <div className="space-y-2">
          <Label htmlFor="provincia">Provincia *</Label>
          <Input
            id="provincia"
            maxLength={2}
            value={formData.provincia}
            onChange={(e) => setFormData({ ...formData, provincia: e.target.value.toUpperCase() })}
            required
          />
        </div>

        {/* Telefono */}
        <div className="space-y-2">
          <Label htmlFor="telefono">Telefono</Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Servizi (opzionale) */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label>Servizi Offerti (opzionale)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowServizi(!showServizi)}
          >
            {showServizi ? "Nascondi" : "Aggiungi Servizi"}
          </Button>
        </div>

        {showServizi && (
          <div className="space-y-3">
            {servizi.map((servizio, index) => (
              <div key={index} className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="space-y-1">
                  <Label className="text-xs">Nome Servizio</Label>
                  <Input
                    placeholder="es. Emocromo"
                    value={servizio.nome}
                    onChange={(e) => updateServizio(index, "nome", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Codice</Label>
                  <Input
                    placeholder="es. EMO001"
                    value={servizio.codice}
                    onChange={(e) => updateServizio(index, "codice", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Prezzo (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="es. 25.00"
                    value={servizio.prezzo}
                    onChange={(e) => updateServizio(index, "prezzo", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Refertazione (ore)</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      placeholder="24"
                      value={servizio.tempoRefertazione}
                      onChange={(e) => updateServizio(index, "tempoRefertazione", e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeServizio(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addServizio}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Servizio
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p>
          <strong>Nota:</strong> Verrà creato automaticamente un account laboratorio con username
          derivato dall&apos;email. Una password temporanea sicura sarà inviata via email al responsabile al primo accesso.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Aggiungi Laboratorio
        </Button>
      </div>
    </form>
  );
}
