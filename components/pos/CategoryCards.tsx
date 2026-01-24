"use client";

import { MenuCategory, MenuItem } from "@/types";
import { cn } from "@/lib/utils";
import {
  Utensils,
  Soup,
  Coffee,
  Salad,
  Grid3x3,
  Egg,
  UtensilsCrossed,
  Drumstick,
  Wine,
} from "lucide-react";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  appetizer: Utensils,
  soup: Soup,
  beverages: Coffee,
  salad: Salad,
  breakfast: Egg,
  lunch: UtensilsCrossed,
  dinner: Drumstick,
  beverage: Wine,
  default: Utensils,
};

interface CategoryCardsProps {
  categories: MenuCategory[];
  activeCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  menuItems: MenuItem[];
}

export function CategoryCards({
  categories,
  activeCategoryId,
  onCategorySelect,
  menuItems,
}: CategoryCardsProps) {
  const sortedCategories = [...categories].sort(
    (a, b) => a.display_order - b.display_order
  );

  const getItemCount = (categoryId: string | null): number => {
    if (categoryId === null) {
      return menuItems.length;
    }
    return menuItems.filter((item) => item.category_id === categoryId).length;
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* All Menu Card */}
      <button
        onClick={() => onCategorySelect(null)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all touch-manipulation flex-shrink-0 border",
          "text-xs font-medium",
          activeCategoryId === null
            ? "bg-primary text-white border-primary shadow-md"
            : "bg-white dark:bg-card text-foreground border-border hover:border-primary/50 hover:shadow-sm"
        )}
        aria-label="View all menu items"
        aria-pressed={activeCategoryId === null}
      >
        <Grid3x3 className="h-4 w-4" />
        <span>All</span>
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full",
          activeCategoryId === null
            ? "bg-white/20"
            : "bg-muted"
        )}>
          {getItemCount(null)}
        </span>
      </button>

      {/* Category Cards */}
      {sortedCategories.map((category) => {
        const Icon = categoryIcons[category.slug.toLowerCase()] || categoryIcons.default;
        const isActive = activeCategoryId === category.id;
        const itemCount = getItemCount(category.id);

        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all touch-manipulation flex-shrink-0 border",
              "text-xs font-medium",
              isActive
                ? "bg-primary text-white border-primary shadow-md"
                : "bg-white dark:bg-card text-foreground border-border hover:border-primary/50 hover:shadow-sm"
            )}
            aria-label={`View ${category.name} category`}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" />
            <span>{category.name}</span>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full",
              isActive
                ? "bg-white/20"
                : "bg-muted"
            )}>
              {itemCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}
