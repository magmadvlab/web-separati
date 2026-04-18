"use client";

import { useId, useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Pill, FileText, Check } from "lucide-react";
import api from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface Farmaco {
  id: number;
  codiceAic: string;
  nomeCommerciale: string;
  principioAttivo: string;
  formaFarmaceutica?: string;
  dosaggio?: string;
  confezione?: string;
  quantitaConfezione?: number;
  unitaMisura?: string;
  classe?: string;
  ricettaRichiesta: boolean;
  mutuabile: boolean;
  fascia?: string;
  prezzo?: number;
  ticket?: number;
  displayName: string;
}

interface DrugSearchProps {
  onSelect: (farmaco: Farmaco) => void;
  selectedFarmaci?: Farmaco[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  inputId?: string;
}

export function DrugSearch({
  onSelect,
  selectedFarmaci = [],
  placeholder = "Cerca farmaco (es. Lodoz, Aspirina...)",
  className = "",
  disabled = false,
  inputId,
}: DrugSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Farmaco[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const autoInputId = useId();
  const resolvedInputId = inputId ?? `drug-search-${autoInputId}`;
  const listboxId = `${resolvedInputId}-listbox`;

  // Cerca farmaci quando la query cambia
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      searchFarmaci(debouncedQuery);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [debouncedQuery]);

  const searchFarmaci = async (searchQuery: string) => {
    setIsLoading(true);
    setIsOpen(true);
    try {
      const response = await api.get<Farmaco[] | { success: boolean; data: Farmaco[] }>(
        `/paziente/farmaci/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );

      // Gestisce sia risposta diretta array che risposta con wrapper {success, data}
      let farmaci: Farmaco[] = [];
      if (Array.isArray(response.data)) {
        farmaci = response.data;
      } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        farmaci = (response.data as { success: boolean; data: Farmaco[] }).data;
      }

      // Filtra farmaci già selezionati
      const filtered = farmaci.filter(
        (farmaco) => !selectedFarmaci.some((selected) => selected.id === farmaco.id)
      );
      setResults(filtered);
      setFocusedIndex(-1);
    } catch (error) {
      console.error("Error searching drugs:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (farmaco: Farmaco) => {
    onSelect(farmaco);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < results.length) {
          handleSelect(results[focusedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (query.length >= 2 && results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay per permettere click sui risultati
    setTimeout(() => {
      setIsOpen(false);
      setFocusedIndex(-1);
    }, 200);
  };

  const isSelected = (farmacoId: number) => {
    return selectedFarmaci.some((f) => f.id === farmacoId);
  };

  return (
    <div className={cn("relative w-full", className)}>
      {/* Input di ricerca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id={resolvedInputId}
          name="drugSearch"
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          className="pl-10 pr-10 w-full"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Risultati autocompletamento */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div
          ref={resultsRef}
          id={listboxId}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm">Ricerca in corso...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Nessun farmaco trovato</p>
            </div>
          ) : (
            <ul className="py-1">
              {results.map((farmaco, index) => {
                const isFocused = index === focusedIndex;
                const alreadySelected = isSelected(farmaco.id);

                return (
                  <li
                    key={farmaco.id}
                    role="option"
                    aria-selected={isFocused}
                    className={cn(
                      "px-4 py-3 cursor-pointer transition-colors",
                      isFocused
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "hover:bg-gray-50",
                      alreadySelected && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !alreadySelected && handleSelect(farmaco)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Pill className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {farmaco.nomeCommerciale}
                          </p>
                          {farmaco.ricettaRichiesta ? (
                            <span className="text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex-shrink-0">
                              <FileText className="h-3 w-3 inline mr-1" />
                              Ricetta
                            </span>
                          ) : (
                            <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded flex-shrink-0">
                              OTC
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {[
                            farmaco.dosaggio,
                            farmaco.formaFarmaceutica,
                            farmaco.confezione,
                          ]
                            .filter(Boolean)
                            .join(" • ") || farmaco.principioAttivo}
                        </p>
                        {farmaco.codiceAic && (
                          <p className="text-[11px] text-gray-400">
                            AIC {farmaco.codiceAic}
                          </p>
                        )}
                      </div>
                      {alreadySelected && (
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
