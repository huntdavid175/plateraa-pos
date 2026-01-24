"use client";

import { MenuCategory, MenuItem } from "@/types";
import { cn } from "@/lib/utils";
import { Grid3x3 } from "lucide-react";

// Category colors with different colors for each category
const categoryColors: Record<string, { bg: string; text: string; activeBg: string; activeText: string }> = {
  all: { 
    bg: "bg-blue-100 dark:bg-blue-900/20", 
    text: "text-blue-700 dark:text-blue-300",
    activeBg: "bg-blue-500 dark:bg-blue-600",
    activeText: "text-white"
  },
  appetizer: { 
    bg: "bg-red-100 dark:bg-red-900/20", 
    text: "text-red-700 dark:text-red-300",
    activeBg: "bg-red-500 dark:bg-red-600",
    activeText: "text-white"
  },
  soup: { 
    bg: "bg-amber-100 dark:bg-amber-900/20", 
    text: "text-amber-700 dark:text-amber-300",
    activeBg: "bg-amber-500 dark:bg-amber-600",
    activeText: "text-white"
  },
  beverages: { 
    bg: "bg-purple-100 dark:bg-purple-900/20", 
    text: "text-purple-700 dark:text-purple-300",
    activeBg: "bg-purple-500 dark:bg-purple-600",
    activeText: "text-white"
  },
  salad: { 
    bg: "bg-green-100 dark:bg-green-900/20", 
    text: "text-green-700 dark:text-green-300",
    activeBg: "bg-green-500 dark:bg-green-600",
    activeText: "text-white"
  },
  beverage: {
    bg: "bg-cyan-100 dark:bg-cyan-900/20",
    text: "text-cyan-700 dark:text-cyan-300",
    activeBg: "bg-cyan-500 dark:bg-cyan-600",
    activeText: "text-white"
  },
  breakfast: { 
    bg: "bg-orange-100 dark:bg-orange-900/20", 
    text: "text-orange-700 dark:text-orange-300",
    activeBg: "bg-orange-500 dark:bg-orange-600",
    activeText: "text-white"
  },
  lunch: { 
    bg: "bg-pink-100 dark:bg-pink-900/20", 
    text: "text-pink-700 dark:text-pink-300",
    activeBg: "bg-pink-500 dark:bg-pink-600",
    activeText: "text-white"
  },
  dinner: { 
    bg: "bg-indigo-100 dark:bg-indigo-900/20", 
    text: "text-indigo-700 dark:text-indigo-300",
    activeBg: "bg-indigo-500 dark:bg-indigo-600",
    activeText: "text-white"
  },
  default: { 
    bg: "bg-gray-100 dark:bg-gray-800", 
    text: "text-gray-700 dark:text-gray-300",
    activeBg: "bg-gray-500 dark:bg-gray-600",
    activeText: "text-white"
  },
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

  const allColors = categoryColors.all;
  
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* All Menu Card */}
      <button
        onClick={() => onCategorySelect(null)}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg transition-all touch-manipulation flex-shrink-0 shadow-sm",
          "w-24 h-16 md:w-20 md:h-14 lg:w-24 lg:h-16",
          "text-xs md:text-[11px] lg:text-xs font-semibold",
          activeCategoryId === null
            ? `${allColors.activeBg} ${allColors.activeText}`
            : `${allColors.bg} ${allColors.text} hover:shadow-md`
        )}
        aria-label="View all menu items"
        aria-pressed={activeCategoryId === null}
      >
        <span>All</span>
        <span className={cn(
          "text-xs mt-1 opacity-75",
          activeCategoryId === null ? allColors.activeText : allColors.text
        )}>
          {getItemCount(null)}
        </span>
      </button>

      {/* Category Cards */}
      {sortedCategories.map((category) => {
        const isActive = activeCategoryId === category.id;
        const itemCount = getItemCount(category.id);
        const colors = categoryColors[category.slug.toLowerCase()] || categoryColors.default;

        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg transition-all touch-manipulation flex-shrink-0 shadow-sm",
              "w-24 h-16 md:w-20 md:h-14 lg:w-24 lg:h-16",
              "text-xs md:text-[11px] lg:text-xs font-semibold",
              isActive
                ? `${colors.activeBg} ${colors.activeText}`
                : `${colors.bg} ${colors.text} hover:shadow-md`
            )}
            aria-label={`View ${category.name} category`}
            aria-pressed={isActive}
          >
            <span className="text-center line-clamp-1">{category.name}</span>
            <span className={cn(
              "text-xs mt-1 opacity-75",
              isActive ? colors.activeText : colors.text
            )}>
              {itemCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}

