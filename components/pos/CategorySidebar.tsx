"use client";

import { MenuCategory } from "@/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Utensils,
  Soup,
  Coffee,
  Salad,
  Clock,
  ChevronRight,
} from "lucide-react";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  appetizer: Utensils,
  soup: Soup,
  beverages: Coffee,
  salad: Salad,
  default: Utensils,
};

interface CategorySidebarProps {
  categories: MenuCategory[];
  activeCategoryId: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

export function CategorySidebar({
  categories,
  activeCategoryId,
  onCategorySelect,
}: CategorySidebarProps) {
  const sortedCategories = [...categories].sort(
    (a, b) => a.display_order - b.display_order
  );

  return (
    <div className="flex h-full flex-col border-r bg-card">
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All Menu Button */}
          <button
            onClick={() => onCategorySelect(null)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors touch-manipulation min-h-[48px]",
              activeCategoryId === null
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-accent text-foreground"
            )}
            aria-label="View all menu items"
          >
            <div className="flex items-center gap-3">
              <Utensils className="h-5 w-5" />
              <span className="text-base">All Menu</span>
            </div>
            {activeCategoryId === null && (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {/* Category Buttons */}
          {sortedCategories.map((category) => {
            const Icon =
              categoryIcons[category.slug.toLowerCase()] ||
              categoryIcons.default;
            const isActive = activeCategoryId === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors touch-manipulation min-h-[48px]",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent text-foreground"
                )}
                aria-label={`View ${category.name} category`}
                aria-pressed={isActive}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  <span className="text-base">{category.name}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </button>
            );
          })}

          {/* History Button */}
          <button
            onClick={() => onCategorySelect("history")}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors touch-manipulation min-h-[48px] mt-4",
              activeCategoryId === "history"
                ? "bg-primary text-primary-foreground font-medium"
                : "hover:bg-accent text-foreground"
            )}
            aria-label="View order history"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5" />
              <span className="text-base">History</span>
            </div>
            {activeCategoryId === "history" && (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </ScrollArea>
    </div>
  );
}

