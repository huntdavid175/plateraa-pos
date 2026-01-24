"use client";

import { OrderItem as OrderItemType } from "@/types";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

interface OrderItemProps {
  item: OrderItemType;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onSpecialInstructions?: (itemId: string, instructions: string) => void;
}

export function OrderItem({
  item,
  onQuantityChange,
  onRemove,
  onSpecialInstructions,
}: OrderItemProps) {
  const [imageError, setImageError] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [instructions, setInstructions] = useState(item.special_instructions || "");

  const handleDecrease = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.id, item.quantity - 1);
    } else {
      onRemove(item.id);
    }
  };

  const handleIncrease = () => {
    onQuantityChange(item.id, item.quantity + 1);
  };

  const handleInstructionsSubmit = () => {
    if (onSpecialInstructions) {
      onSpecialInstructions(item.id, instructions);
    }
    setShowInstructions(false);
  };

  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
        {item.menu_item.image_url && !imageError ? (
          <Image
            src={item.menu_item.image_url}
            alt={item.menu_item.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-sm md:text-xs lg:text-sm line-clamp-1">
            {item.menu_item.name}
          </h4>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
            onClick={() => onRemove(item.id)}
            aria-label={`Remove ${item.menu_item.name} from order`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Variations */}
        {item.selected_variations && item.selected_variations.length > 0 && (
          <div className="text-xs text-muted-foreground mb-1 space-y-0.5">
            {item.selected_variations.map((variation, idx) => (
              <div key={idx}>
                <span className="font-medium">{variation.variation_name}:</span>{" "}
                {variation.option_name}
              </div>
            ))}
          </div>
        )}

        {/* Add-ons */}
        {item.selected_add_ons && item.selected_add_ons.length > 0 && (
          <div className="text-xs text-muted-foreground mb-1">
            <div className="font-medium mb-0.5">Add-ons:</div>
            <div className="space-y-0.5">
              {item.selected_add_ons.map((addOn, idx) => (
                <div key={idx}>
                  • {addOn.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm md:text-xs lg:text-sm font-medium text-primary">
            ₵{item.subtotal.toLocaleString()}
          </span>
          <span className="text-xs md:text-[0.65rem] lg:text-xs text-muted-foreground">
            ₵{item.price.toLocaleString()} each
          </span>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 touch-manipulation"
            onClick={handleDecrease}
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm md:text-xs lg:text-sm font-medium w-8 text-center">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 touch-manipulation"
            onClick={handleIncrease}
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Special Instructions */}
        {onSpecialInstructions && (
          <div className="mt-2">
            {!showInstructions ? (
              <button
                onClick={() => setShowInstructions(true)}
                className="text-xs text-muted-foreground hover:text-foreground underline touch-manipulation"
                aria-label="Add special instructions"
              >
                {item.special_instructions
                  ? "Edit instructions"
                  : "Add instructions"}
              </button>
            ) : (
              <div className="space-y-1">
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Special instructions..."
                  className="w-full text-xs p-2 rounded border resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setShowInstructions(false);
                      setInstructions(item.special_instructions || "");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={handleInstructionsSubmit}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
            {item.special_instructions && !showInstructions && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                "{item.special_instructions}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

