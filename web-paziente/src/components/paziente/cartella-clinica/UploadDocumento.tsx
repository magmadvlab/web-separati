'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, Image as ImageIcon, FileCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface UploadDocumentoProps {
  onUploadSuccess?: () => void;
}

export function UploadDocumento({ onUploadSuccess }: UploadDocumentoProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [tipo, setTipo] = useState('nota');
  const [categoria, setCategoria] = useState('medicina_generale');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Valida tipo file
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Errore',
        description: 'Tipo di file non supportato. Usa JPG, PNG, WEBP, PDF o DOC/DOCX',
        variant: 'destructive',
      });
      return;
    }

    // Valida dimensione (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'Errore',
        description: 'Il file è troppo grande (max 20MB)',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Errore',
        description: 'Seleziona un file da caricare',
        variant: 'destructive',
      });
      return;
    }

    if (!titolo.trim()) {
      toast({
        title: 'Errore',
        description: 'Inserisci un titolo per il documento',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // 1. Upload del file
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadResponse = await api.post('/paziente/upload/cartella-clinica/documento', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const fileData = uploadResponse.data.data;

      // 2. Crea il documento nella cartella clinica
      await api.post('/paziente/cartella-clinica/documenti', {
        titolo,
        descrizione,
        tipo,
        categoria,
        fileAllegatoUrl: fileData.url,
        tipoFile: fileData.mimeType,
        dataEvento: new Date().toISOString(),
        visibilitaMedico: true,
      });

      toast({
        title: 'Documento caricato',
        description: 'Il documento è stato aggiunto alla tua cartella clinica',
      });

      // Reset form
      setSelectedFile(null);
      setTitolo('');
      setDescrizione('');
      setTipo('nota');
      setCategoria('medicina_generale');

      // Callback per aggiornare la lista
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Errore upload documento:', error);
      toast({
        title: 'Errore',
        description: 'Errore durante il caricamento del documento',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FileText className="h-8 w-8 text-gray-400" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    
    return <FileCheck className="h-8 w-8 text-green-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Carica Nuovo Documento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div>
          <Label htmlFor="file-upload">File</Label>
          <div className="mt-2">
            <input
              id="file-upload"
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {selectedFile ? 'Cambia File' : 'Seleziona File'}
            </Button>
          </div>
          {selectedFile && (
            <div className="mt-2 p-3 bg-muted rounded-lg flex items-center gap-3">
              {getFileIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Titolo */}
        <div>
          <Label htmlFor="titolo">Titolo *</Label>
          <Input
            id="titolo"
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            placeholder="Es: Referto analisi del sangue"
            maxLength={200}
          />
        </div>

        {/* Descrizione */}
        <div>
          <Label htmlFor="descrizione">Descrizione</Label>
          <Textarea
            id="descrizione"
            value={descrizione}
            onChange={(e) => setDescrizione(e.target.value)}
            placeholder="Aggiungi una descrizione opzionale..."
            rows={3}
            maxLength={500}
          />
        </div>

        {/* Tipo */}
        <div>
          <Label htmlFor="tipo">Tipo Documento</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nota">Nota Personale</SelectItem>
              <SelectItem value="visita_medica">Visita Medica</SelectItem>
              <SelectItem value="esame_diagnostico">Esame Diagnostico</SelectItem>
              <SelectItem value="prescrizione">Prescrizione</SelectItem>
              <SelectItem value="referto_laboratorio">Referto Laboratorio</SelectItem>
              <SelectItem value="anamnesi">Anamnesi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categoria */}
        <div>
          <Label htmlFor="categoria">Categoria</Label>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="medicina_generale">Medicina Generale</SelectItem>
              <SelectItem value="ortopedia">Ortopedia</SelectItem>
              <SelectItem value="cardiologia">Cardiologia</SelectItem>
              <SelectItem value="radiologia">Radiologia</SelectItem>
              <SelectItem value="farmacologia">Farmacologia</SelectItem>
              <SelectItem value="analisi">Analisi</SelectItem>
              <SelectItem value="altro">Altro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pulsante Upload */}
        <Button
          onClick={handleUpload}
          disabled={uploading || !selectedFile || !titolo.trim()}
          className="w-full"
        >
          {uploading ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              Caricamento...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Carica Documento
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
