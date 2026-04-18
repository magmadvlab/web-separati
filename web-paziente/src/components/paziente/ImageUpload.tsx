"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { MatchingResults } from "./MatchingResults";

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string | null) => void;
  onFarmaciFound?: (farmaci: any[]) => void;
  label?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  enableOcr?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onFarmaciFound,
  label = "Carica foto talloncino",
  maxSize = 5,
  className = "",
  disabled = false,
  enableOcr = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState<string | null>(null);
  const [matchingResults, setMatchingResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!allowedMimeTypes.includes(file.type)) {
      setError("Formato non supportato. Usa JPG, PNG, WEBP o HEIC (iPhone)");
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`L'immagine è troppo grande. Dimensione massima: ${maxSize}MB`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);

      // Scegli endpoint in base a enableOcr
      const endpoint = enableOcr 
        ? "/paziente/upload/talloncino/ocr"
        : "/paziente/upload/talloncino";

      // Upload to backend
      const response = await api.post<{
        success: boolean;
        data: { 
          url: string; 
          path: string;
          farmaci?: any[];
          risultatiMatching?: any[];
          extractedText?: string;
        };
      }>(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success && response.data.data.url) {
        // L'URL è già relativo, il backend lo serve su /uploads
        const imageUrl = response.data.data.url;
        setPreview(imageUrl);
        onChange?.(imageUrl);

        // Se OCR è abilitato e ci sono risultati matching, mostra i risultati
        if (enableOcr) {
          if (response.data.data.risultatiMatching && response.data.data.risultatiMatching.length > 0) {
            setMatchingResults(response.data.data.risultatiMatching);
          } else if (response.data.data.farmaci && response.data.data.farmaci.length > 0) {
            // Fallback per formato vecchio
            setMatchingResults(response.data.data.farmaci);
            onFarmaciFound?.(response.data.data.farmaci);
          }
        }
      } else {
        throw new Error("Errore durante il caricamento");
      }
    } catch (err: any) {
      console.error("Error uploading image:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Errore durante il caricamento dell'immagine",
      );
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange?.(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="flex flex-col gap-3">
        {/* Preview */}
        {preview && (
          <div className="relative w-full max-w-md mx-auto">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3010"}${preview}`}
                alt="Preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback se l'immagine non viene caricata
                  console.error("Error loading image:", preview);
                }}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  aria-label="Rimuovi immagine"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upload Button - Mobile Friendly */}
        {!preview && (
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={disabled || uploading}
              capture="environment" // Mobile: use back camera
            />
            <Button
              type="button"
              onClick={handleButtonClick}
              disabled={disabled || uploading}
              variant="outline"
              className="w-full h-32 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="text-sm text-gray-600">Caricamento...</span>
                </>
              ) : (
                <>
                  <Camera className="h-8 w-8 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Scatta o carica foto
                  </span>
                  <span className="text-xs text-gray-500">
                    Max {maxSize}MB - JPG, PNG, WEBP
                  </span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Replace Button (when preview exists) */}
        {preview && !disabled && (
          <Button
            type="button"
            onClick={handleButtonClick}
            disabled={uploading}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                Caricamento...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Sostituisci immagine
              </>
            )}
          </Button>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Matching Results */}
        {enableOcr && matchingResults.length > 0 && (
          <MatchingResults
            risultati={matchingResults}
            onSelect={(farmaco) => {
              onFarmaciFound?.([farmaco]);
            }}
          />
        )}
      </div>
    </div>
  );
}
