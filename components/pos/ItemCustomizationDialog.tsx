"use client";

import { useState, useEffect } from "react";
import { MenuItem, SelectedVariation, SelectedAddOn } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ImageOff, Plus, Check } from "lucide-react";

interface ItemCustomizationDialogProps {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (item: MenuItem, options: {
    variations: SelectedVariation[];
    addOns: SelectedAddOn[];
    specialInstructions?: string;
  }) => void;
}

export function ItemCustomizationDialog({
  item,
  open,
  onOpenChange,
  onAddToCart,
}: ItemCustomizationDialogProps) {
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (open && item) {
      const defaults: Record<string, string> = {};
      item.variations?.forEach((variation) => {
        if (variation.required && variation.options.length > 0) {
          defaults[variation.id] = variation.options[0].id;
        }
      });
      setSelectedVariations(defaults);
      setSelectedAddOns(new Set());
      setSpecialInstructions("");
      setImageError(false);
    } else if (!open) {
      setSelectedVariations({});
      setSelectedAddOns(new Set());
      setSpecialInstructions("");
    }
  }, [open, item]);

  if (!item) return null;

  const handleVariationSelect = (variationId: string, optionId: string) => {
    setSelectedVariations((prev) => ({ ...prev, [variationId]: optionId }));
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(addOnId)) {
        newSet.delete(addOnId);
      } else {
        newSet.add(addOnId);
      }
      return newSet;
    });
  };

  const calculatePrice = (): number => {
    let total = item.price;
    item.variations?.forEach((variation) => {
      const selectedOptionId = selectedVariations[variation.id];
      if (selectedOptionId) {
        const option = variation.options.find((opt) => opt.id === selectedOptionId);
        if (option) total += option.price_modifier;
      }
    });
    item.add_ons?.forEach((addOn) => {
      if (selectedAddOns.has(addOn.id)) total += addOn.price;
    });
    return total;
  };

  const canAddToCart = (): boolean => {
    if (item.variations) {
      for (const variation of item.variations) {
        if (variation.required && !selectedVariations[variation.id]) return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!canAddToCart()) return;

    const variations: SelectedVariation[] = [];
    item.variations?.forEach((variation) => {
      const selectedOptionId = selectedVariations[variation.id];
      if (selectedOptionId) {
        const option = variation.options.find((opt) => opt.id === selectedOptionId);
        if (option) {
          variations.push({
            variation_id: variation.id,
            variation_name: variation.name,
            option_id: option.id,
            option_name: option.name,
            price_modifier: option.price_modifier,
          });
        }
      }
    });

    const addOns: SelectedAddOn[] = [];
    item.add_ons?.forEach((addOn) => {
      if (selectedAddOns.has(addOn.id)) {
        addOns.push({ add_on_id: addOn.id, name: addOn.name, price: addOn.price });
      }
    });

    onAddToCart(item, {
      variations,
      addOns,
      specialInstructions: specialInstructions.trim() || undefined,
    });
    onOpenChange(false);
  };

  const currentPrice = calculatePrice();
  const hasCustomizations = (item.variations && item.variations.length > 0) || (item.add_ons && item.add_ons.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex">
          {/* Left Side - Image */}
          <div className="w-48 flex-shrink-0 bg-muted relative">
            {item.image_url && !imageError ? (
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                sizes="192px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center min-h-[200px]">
                <ImageOff className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <DialogHeader className="p-4 pb-3 border-b">
              <DialogTitle className="text-base font-bold pr-6">{item.name}</DialogTitle>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
              )}
            </DialogHeader>

            {/* Options */}
            <div className="flex-1 p-4 space-y-4">
              {/* Variations */}
              {item.variations && item.variations.length > 0 && (
                <div className="space-y-3">
                  {item.variations.map((variation) => (
                    <div key={variation.id}>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                        {variation.name}
                        {variation.required && <span className="text-destructive ml-1">*</span>}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {variation.options.map((option) => {
                          const isSelected = selectedVariations[variation.id] === option.id;
                          return (
                            <button
                              key={option.id}
                              onClick={() => handleVariationSelect(variation.id, option.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                                isSelected
                                  ? "bg-primary text-white"
                                  : "bg-muted hover:bg-muted/80 text-foreground"
                              )}
                            >
                              {option.name}
                              {option.price_modifier !== 0 && (
                                <span className="ml-1 opacity-75">
                                  {option.price_modifier > 0 ? "+" : ""}₵{Math.abs(option.price_modifier)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add-ons */}
              {item.add_ons && item.add_ons.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">
                    Add-ons
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {item.add_ons.map((addOn) => {
                      const isSelected = selectedAddOns.has(addOn.id);
                      return (
                        <button
                          key={addOn.id}
                          onClick={() => handleAddOnToggle(addOn.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          )}
                        >
                          {isSelected ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          {addOn.name}
                          <span className="opacity-75">+₵{addOn.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Instructions - compact */}
              <div>
                <Input
                  placeholder="Special instructions (optional)"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Total</span>
                <div className="text-xl font-bold text-primary">₵{currentPrice.toFixed(2)}</div>
              </div>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart();
                }}
                disabled={!canAddToCart()}
                className="px-6 h-10 text-sm font-medium"
                type="button"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
