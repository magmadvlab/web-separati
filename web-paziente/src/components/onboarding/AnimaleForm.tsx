import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus } from 'lucide-react';

export interface Animale {
  nome: string;
  tipo: string;
  razza?: string;
  eta?: number;
  peso?: number;
}

interface AnimaleFormProps {
  animali: Animale[];
  onAdd: (animale: Animale) => void;
  onRemove: (index: number) => void;
}

export function AnimaleForm({ animali, onAdd, onRemove }: AnimaleFormProps) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('');
  const [razza, setRazza] = useState('');
  const [eta, setEta] = useState('');
  const [peso, setPeso] = useState('');

  const handleAdd = () => {
    if (nome && tipo) {
      onAdd({
        nome,
        tipo,
        razza: razza || undefined,
        eta: eta ? parseInt(eta, 10) : undefined,
        peso: peso ? parseFloat(peso) : undefined,
      });
      // Reset form
      setNome('');
      setTipo('');
      setRazza('');
      setEta('');
      setPeso('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Lista animali aggiunti */}
      {animali.length > 0 && (
        <div className="space-y-2">
          {animali.map((animale, index) => (
            <Card key={index} className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{animale.nome}</h4>
                    <p className="text-sm text-gray-600">
                      {animale.tipo}
                      {animale.razza && ` • ${animale.razza}`}
                      {animale.eta && ` • ${animale.eta} anni`}
                      {animale.peso && ` • ${animale.peso} kg`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form nuovo animale */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h4 className="font-semibold text-gray-900">Aggiungi Animale</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Es: Fido"
              />
            </div>
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cane">Cane</SelectItem>
                  <SelectItem value="gatto">Gatto</SelectItem>
                  <SelectItem value="coniglio">Coniglio</SelectItem>
                  <SelectItem value="uccello">Uccello</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="razza">Razza</Label>
              <Input
                id="razza"
                value={razza}
                onChange={(e) => setRazza(e.target.value)}
                placeholder="Es: Labrador"
              />
            </div>
            <div>
              <Label htmlFor="eta">Età (anni)</Label>
              <Input
                id="eta"
                type="number"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                placeholder="Es: 5"
              />
            </div>
            <div>
              <Label htmlFor="peso">Peso (kg)</Label>
              <Input
                id="peso"
                type="number"
                step="0.1"
                value={peso}
                onChange={(e) => setPeso(e.target.value)}
                placeholder="Es: 25.5"
              />
            </div>
          </div>

          <Button
            onClick={handleAdd}
            disabled={!nome || !tipo}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Aggiungi Animale
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
