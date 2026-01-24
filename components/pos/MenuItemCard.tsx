"use client";

import { MenuItem, SelectedVariation, SelectedAddOn } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import { ItemCustomizationDialog } from "./ItemCustomizationDialog";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (
    item: MenuItem,
    options: {
      variations: SelectedVariation[];
      addOns: SelectedAddOn[];
      specialInstructions?: string;
    }
  ) => void;
}

export function MenuItemCard({ item, onAddToCart }: MenuItemCardProps) {
  const [imageError, setImageError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isOutOfStock = !item.is_available;

  const handleClick = () => {
    if (!isOutOfStock) {
      // If item has variations or add-ons, open dialog; otherwise add directly
      if (item.variations?.length || item.add_ons?.length) {
        setDialogOpen(true);
      } else {
        onAddToCart(item, { variations: [], addOns: [] });
      }
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all touch-manipulation cursor-pointer",
        "hover:shadow-lg active:scale-[0.98]",
        isOutOfStock && "opacity-60 cursor-not-allowed"
      )}
      onClick={handleClick}
      role="button"
      tabIndex={isOutOfStock ? -1 : 0}
      aria-label={`Add ${item.name} to cart`}
      aria-disabled={isOutOfStock}
    >
      {/* Image */}
      <div className="relative w-full aspect-square bg-muted overflow-hidden">
        {item.image_url && !imageError ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-sm px-3 py-1">
              Out of Stock
            </Badge>
          </div>
        )}

        {/* Featured Badge */}
        {item.is_featured && !isOutOfStock && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-primary text-primary-foreground">
              Best Seller
            </Badge>
          </div>
        )}

        {/* Add Button */}
        {!isOutOfStock && (
          <div className="absolute bottom-2 right-2">
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              aria-label={`Add ${item.name} to cart`}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-xs md:text-[10px] lg:text-xs mb-2 line-clamp-2">
          {item.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm md:text-xs lg:text-sm font-bold text-primary">
            ₵{item.price.toLocaleString()}
          </span>
          {item.preparation_time && (
            <span className="text-[10px] md:text-[8px] lg:text-[10px] text-muted-foreground">
              {item.preparation_time} min
            </span>
          )}
        </div>
      </div>

      {/* Customization Dialog */}
      <ItemCustomizationDialog
        item={item}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAddToCart={onAddToCart}
      />
    </Card>
  );
}

