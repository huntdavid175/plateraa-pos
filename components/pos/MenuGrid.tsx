"use client";

import { MenuItem, MenuCategory, SelectedVariation, SelectedAddOn } from "@/types";
import { MenuItemCard } from "./MenuItemCard";
import { CategoryCards } from "./CategoryCards";
import { Search } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface MenuGridProps {
  items: MenuItem[];
  categories: MenuCategory[];
  activeCategoryId: string | null;
  onAddToCart: (
    item: MenuItem,
    options: {
      variations: SelectedVariation[];
      addOns: SelectedAddOn[];
      specialInstructions?: string;
    }
  ) => void;
  onCategorySelect: (categoryId: string | null) => void;
}

export function MenuGrid({
  items,
  categories,
  activeCategoryId,
  onAddToCart,
  onCategorySelect,
}: MenuGridProps) {
  // Filter items by category
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Category filter
    if (activeCategoryId) {
      filtered = filtered.filter(
        (item) => item.category_id === activeCategoryId
      );
    }

    // Sort by featured first, then by name
    const sorted = [...filtered].sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [items, activeCategoryId]);

  return (
    <div className="flex flex-col h-full">
      {/* Category Cards - Horizontal */}
      <div className="p-4 border-b bg-background">
        <CategoryCards
          categories={categories}
          activeCategoryId={activeCategoryId}
          onCategorySelect={onCategorySelect}
          menuItems={items}
        />
      </div>

      {/* Menu Grid */}
      <div className="flex-1 overflow-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-base font-medium mb-2">No items found</p>
            <p className="text-xs text-muted-foreground">
              No items available in this category
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-4",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            )}
          >
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      {filteredItems.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            Showing {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

