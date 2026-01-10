"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin, Loader2 } from "lucide-react";

interface LocationSuggestion {
  id: string;
  description: string;
  placeId?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: LocationSuggestion) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

// Mock location suggestions - In production, this would use Google Places API
const getMockSuggestions = (query: string): LocationSuggestion[] => {
  if (!query || query.length < 2) return [];

  const queryLower = query.toLowerCase();
  const allLocations: LocationSuggestion[] = [
    { id: "1", description: "Accra Mall, Spintex Road, Accra", placeId: "place_1" },
    { id: "2", description: "East Legon, Accra", placeId: "place_2" },
    { id: "3", description: "Osu, Oxford Street, Accra", placeId: "place_3" },
    { id: "4", description: "Airport Residential Area, Accra", placeId: "place_4" },
    { id: "5", description: "Labone, Accra", placeId: "place_5" },
    { id: "6", description: "Cantonments, Accra", placeId: "place_6" },
    { id: "7", description: "Tema, Community 1", placeId: "place_7" },
    { id: "8", description: "Tema, Community 5", placeId: "place_8" },
    { id: "9", description: "Teshie, Accra", placeId: "place_9" },
    { id: "10", description: "Madina, Accra", placeId: "place_10" },
    { id: "11", description: "Adenta, Accra", placeId: "place_11" },
    { id: "12", description: "Dansoman, Accra", placeId: "place_12" },
    { id: "13", description: "Kumasi, Adum", placeId: "place_13" },
    { id: "14", description: "Kumasi, Asokwa", placeId: "place_14" },
    { id: "15", description: "Tamale, Central", placeId: "place_15" },
  ];

  return allLocations
    .filter((location) =>
      location.description.toLowerCase().includes(queryLower)
    )
    .slice(0, 5);
};

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Enter delivery address",
  className,
  required = false,
}: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const results = getMockSuggestions(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsLoading(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsLoading(false);
    };
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelectedIndex(-1);
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(suggestion);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={cn("h-12 text-base pr-10", className)}
          required={required}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-start gap-3 touch-manipulation",
                index === selectedIndex && "bg-accent"
              )}
            >
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-sm flex-1">{suggestion.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

