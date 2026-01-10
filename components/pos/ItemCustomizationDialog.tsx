"use client";

import { useState, useEffect } from "react";
import { MenuItem, SelectedVariation, SelectedAddOn } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { ImageOff } from "lucide-react";

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
  const [selectedVariations, setSelectedVariations] = useState<
    Record<string, string>
  >({});
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [imageError, setImageError] = useState(false);

  // Reset state when dialog opens/closes or item changes
  useEffect(() => {
    if (open && item) {
      // Set default selections for required variations
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
      // Reset state when dialog closes
      setSelectedVariations({});
      setSelectedAddOns(new Set());
      setSpecialInstructions("");
    }
  }, [open, item]);

  if (!item) return null;

  const handleVariationSelect = (variationId: string, optionId: string) => {
    setSelectedVariations((prev) => ({
      ...prev,
      [variationId]: optionId,
    }));
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

    // Add variation price modifiers
    item.variations?.forEach((variation) => {
      const selectedOptionId = selectedVariations[variation.id];
      if (selectedOptionId) {
        const option = variation.options.find((opt) => opt.id === selectedOptionId);
        if (option) {
          total += option.price_modifier;
        }
      }
    });

    // Add add-on prices
    item.add_ons?.forEach((addOn) => {
      if (selectedAddOns.has(addOn.id)) {
        total += addOn.price;
      }
    });

    return total;
  };

  const canAddToCart = (): boolean => {
    // Check if all required variations are selected
    if (item.variations) {
      for (const variation of item.variations) {
        if (variation.required && !selectedVariations[variation.id]) {
          return false;
        }
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
        addOns.push({
          add_on_id: addOn.id,
          name: addOn.name,
          price: addOn.price,
        });
      }
    });

    // Prepare cart data
    const cartData = {
      variations,
      addOns,
      specialInstructions: specialInstructions.trim() || undefined,
    };

    // Add to cart
    onAddToCart(item, cartData);

    // Close modal immediately
    onOpenChange(false);
  };

  const currentPrice = calculatePrice();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[90vh] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b">
          <DialogTitle className="text-xl">{item.name}</DialogTitle>
          {item.description && (
            <DialogDescription>{item.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="space-y-6 py-4">
            {/* Item Image */}
            {item.image_url && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                {!imageError ? (
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            )}

            {/* Variations */}
            {item.variations && item.variations.length > 0 && (
              <div className="space-y-4">
                {item.variations.map((variation) => (
                  <div key={variation.id} className="space-y-2">
                    <label className="text-base font-semibold block">
                      {variation.name}
                      {variation.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {variation.options.map((option) => {
                        const isSelected =
                          selectedVariations[variation.id] === option.id;
                        return (
                          <button
                            key={option.id}
                            onClick={() =>
                              handleVariationSelect(variation.id, option.id)
                            }
                            className={cn(
                              "px-4 py-2 rounded-lg border-2 transition-all touch-manipulation text-sm font-medium",
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50 bg-card"
                            )}
                            aria-pressed={isSelected}
                          >
                            {option.name}
                            {option.price_modifier !== 0 && (
                              <span className="ml-1 text-xs">
                                {option.price_modifier > 0 ? "+" : ""}
                                ₵{Math.abs(option.price_modifier).toFixed(2)}
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
              <div className="space-y-3">
                <label className="text-base font-semibold block">Add-ons</label>
                <div className="space-y-2">
                  {item.add_ons.map((addOn) => {
                    const isSelected = selectedAddOns.has(addOn.id);
                    return (
                      <button
                        key={addOn.id}
                        onClick={() => handleAddOnToggle(addOn.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all touch-manipulation text-left",
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 bg-card"
                        )}
                        aria-pressed={isSelected}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{addOn.name}</div>
                          {addOn.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {addOn.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            +₵{addOn.price.toFixed(2)}
                          </span>
                          <div
                            className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-border"
                            )}
                          >
                            {isSelected && (
                              <svg
                                className="h-3 w-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div className="space-y-2">
              <label htmlFor="special-instructions" className="text-base font-semibold block">
                Special Instructions
              </label>
              <Input
                id="special-instructions"
                placeholder="Any special requests or modifications..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
        </div>

        {/* Footer with Price and Add Button */}
        <div className="border-t p-6 space-y-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold text-primary">
              ₵{currentPrice.toFixed(2)}
            </span>
          </div>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={!canAddToCart()}
            className="w-full h-12 text-base font-medium"
            type="button"
          >
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

