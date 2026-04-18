"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface AddFarmaciaFormProps {
  cittaId: number;
  onSuccess: () => void;
}

interface Orario {
  giorno: number;
  apertura: string;
  chiusura: string;
  aperta: boolean;
}

const GIORNI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

export function AddFarmaciaForm({ cittaId, onSuccess }: AddFarmaciaFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    partitaIva: "",
    codiceFarmacia: "",
    indirizzo: "",
    cap: "",
    provincia: "",
    telefono: "",
    email: "",
  });

  const [orari, setOrari] = useState<Orario[]>([]);
  const [showOrari, setShowOrari] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: typeof formData & { orari?: Orario[] }) => {
      const response = await api.post(`/admin/citta/${cittaId}/farmacie`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Farmacia aggiunta con successo!");
      queryClient.invalidateQueries({ queryKey: ["admin-servizi-citta", cittaId] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Errore durante l'aggiunta della farmacia");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      orari: orari.length > 0 ? orari : undefined,
    };
    mutation.mutate(payload);
  };

  const addOrario = () => {
    setOrari([
      ...orari,
      {
        giorno: 1, // Lunedì
        apertura: "09:00",
        chiusura: "19:00",
        aperta: true,
      },
    ]);
  };

  const removeOrario = (index: number) => {
    setOrari(orari.filter((_, i) => i !== index));
  };

  const updateOrario = (index: number, field: keyof Orario, value: any) => {
    const newOrari = [...orari];
    newOrari[index] = { ...newOrari[index], [field]: value };
    setOrari(newOrari);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Nome */}
        <div className="space-y-2 col-span-2">
          <Label htmlFor="nome">Nome Farmacia *</Label>
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

        {/* Codice Farmacia */}
        <div className="space-y-2">
          <Label htmlFor="codiceFarmacia">Codice Farmacia *</Label>
          <Input
            id="codiceFarmacia"
            value={formData.codiceFarmacia}
            onChange={(e) => setFormData({ ...formData, codiceFarmacia: e.target.value })}
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

      {/* Orari (opzionale) */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label>Orari di Apertura (opzionale)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowOrari(!showOrari)}
          >
            {showOrari ? "Nascondi" : "Aggiungi Orari"}
          </Button>
        </div>

        {showOrari && (
          <div className="space-y-3">
            {orari.map((orario, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={orario.giorno}
                  onChange={(e) => updateOrario(index, "giorno", parseInt(e.target.value))}
                >
                  {GIORNI.map((giorno, i) => (
                    <option key={i} value={i}>
                      {giorno}
                    </option>
                  ))}
                </select>

                <Input
                  type="time"
                  className="w-32"
                  value={orario.apertura}
                  onChange={(e) => updateOrario(index, "apertura", e.target.value)}
                />

                <span className="text-sm text-gray-500">-</span>

                <Input
                  type="time"
                  className="w-32"
                  value={orario.chiusura}
                  onChange={(e) => updateOrario(index, "chiusura", e.target.value)}
                />

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={orario.aperta}
                    onCheckedChange={(checked) => updateOrario(index, "aperta", checked)}
                  />
                  <span className="text-sm">Aperta</span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOrario(index)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addOrario}>
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Orario
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p>
          <strong>Nota:</strong> Verrà creato automaticamente un account farmacista con username
          derivato dall&apos;email. Una password temporanea sicura sarà inviata via email al titolare al primo accesso.
        </p>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Aggiungi Farmacia
        </Button>
      </div>
    </form>
  );
}
