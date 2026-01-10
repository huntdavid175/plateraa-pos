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

// Category colors matching the reference
const categoryColors: Record<string, string> = {
  all: "bg-blue-200", // Blue for "All"
  appetizer: "bg-white",
  soup: "bg-white",
  beverages: "bg-white",
  salad: "bg-white",
  default: "bg-white",
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

  // Calculate item counts
  const getItemCount = (categoryId: string | null): number => {
    if (categoryId === null) {
      return menuItems.length;
    }
    return menuItems.filter((item) => item.category_id === categoryId).length;
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* All Menu Card */}
      <button
        onClick={() => onCategorySelect(null)}
        className={cn(
          "flex flex-col items-center justify-center p-5 rounded-xl transition-all touch-manipulation min-w-[140px] flex-shrink-0 shadow-md",
          activeCategoryId === null
            ? "bg-blue-200 dark:bg-blue-900/30"
            : "bg-white dark:bg-card border border-gray-200 dark:border-border hover:shadow-lg"
        )}
        aria-label="View all menu items"
        aria-pressed={activeCategoryId === null}
      >
        <Grid3x3 className={cn(
          "h-8 w-8 mb-3",
          activeCategoryId === null ? "text-black dark:text-white" : "text-blue-500 dark:text-blue-400"
        )} />
        <span className="text-base font-bold mb-1 text-black dark:text-foreground">
          All
        </span>
        <span className="text-xs text-black/70 dark:text-muted-foreground font-normal">
          {getItemCount(null)}+ items
        </span>
      </button>

      {/* Category Cards */}
      {sortedCategories.map((category, index) => {
        const Icon =
          categoryIcons[category.slug.toLowerCase()] ||
          categoryIcons.default;
        const isActive = activeCategoryId === category.id;
        const itemCount = getItemCount(category.id);
        const colorClass = categoryColors[category.slug.toLowerCase()] || categoryColors.default;

        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={cn(
              "flex flex-col items-center justify-center p-5 rounded-xl transition-all touch-manipulation min-w-[140px] flex-shrink-0 shadow-md",
              isActive
                ? "bg-blue-200 dark:bg-blue-900/30"
                : "bg-white dark:bg-card border border-gray-200 dark:border-border hover:shadow-lg"
            )}
            aria-label={`View ${category.name} category`}
            aria-pressed={isActive}
          >
            <Icon className={cn(
              "h-8 w-8 mb-3",
              isActive ? "text-black dark:text-white" : "text-blue-500 dark:text-blue-400"
            )} />
            <span className="text-base font-bold mb-1 text-black dark:text-foreground">
              {category.name}
            </span>
            <span className="text-xs text-black/70 dark:text-muted-foreground font-normal">
              {itemCount} items
            </span>
          </button>
        );
      })}
    </div>
  );
}

