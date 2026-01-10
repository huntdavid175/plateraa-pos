"use client";

import { MenuItem, MenuCategory, SelectedVariation, SelectedAddOn } from "@/types";
import { MenuItemCard } from "./MenuItemCard";
import { CategoryCards } from "./CategoryCards";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, ArrowUpDown } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type SortOption = "popular" | "price-low" | "price-high" | "name";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Category filter
    if (activeCategoryId) {
      filtered = filtered.filter(
        (item) => item.category_id === activeCategoryId
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    // Availability filter
    if (showAvailableOnly) {
      filtered = filtered.filter((item) => item.is_available);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          // Featured items first, then by name
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return a.name.localeCompare(b.name);
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [items, activeCategoryId, searchQuery, showAvailableOnly, sortBy]);

  const activeCategory = categories.find((c) => c.id === activeCategoryId);

  return (
    <div className="flex flex-col h-full">
      {/* Search and Filter Bar */}
      <div className="p-4 border-b space-y-3 bg-background">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              aria-label="Search menu items"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
            aria-pressed={showFilters}
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Sort menu items"
              >
                <option value="popular">Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                aria-label="Show available items only"
              />
              <span className="text-sm">Show available items only</span>
            </label>
          </div>
        )}

        {/* Active Category Badge */}
        {activeCategory && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Category:</span>
            <span className="text-sm font-medium">{activeCategory.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="h-6 px-2"
              aria-label="Clear category filter"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Category Cards - Horizontal */}
      <div className="pt-4 border-b bg-background">
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
            <p className="text-lg font-medium mb-2">No items found</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "No items available in this category"}
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
          <p className="text-sm text-muted-foreground text-center">
            Showing {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

