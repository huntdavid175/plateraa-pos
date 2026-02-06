import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MenuCategory, MenuItem, Variation } from "@/types";

// Enable ISR for this route – cached per unique URL (including query string)
export const revalidate = 60; // seconds

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const institutionId = searchParams.get("institution_id");

  if (!institutionId) {
    return NextResponse.json(
      { error: "Missing institution_id query parameter" },
      { status: 400 }
    );
  }

  try {
    // Fetch categories
    const { data: categoryRows, error: categoryError } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("institution_id", institutionId)
      .eq("is_visible", true)
      .order("sort_order");

    if (categoryError) {
      console.error("[API /menu] Error fetching categories", categoryError);
      return NextResponse.json(
        { error: "Failed to fetch menu categories" },
        { status: 500 }
      );
    }

    const categories: MenuCategory[] =
      categoryRows?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-"),
        icon: cat.icon || undefined,
        display_order: cat.sort_order ?? 0,
        created_at: cat.created_at,
      })) ?? [];

    // Fetch menu items with variants and addons
    const { data: itemRows, error: itemError } = await supabase
      .from("menu_items")
      .select(
        `
        *,
        menu_item_variants (id, name, price, sort_order, is_default),
        menu_item_addons (id, name, price, sort_order, is_available)
      `
      )
      .eq("institution_id", institutionId)
      .eq("is_available", true)
      .order("created_at", { ascending: true });

    if (itemError) {
      console.error("[API /menu] Error fetching items", itemError);
      return NextResponse.json(
        { error: "Failed to fetch menu items" },
        { status: 500 }
      );
    }

    const items: MenuItem[] =
      itemRows?.map((row: any) => {
        let variations: Variation[] | undefined;

        if (row.menu_item_variants && row.menu_item_variants.length > 0) {
          const basePrice = Number(row.price ?? 0);
          variations = [
            {
              id: `var-${row.id}`,
              name: "Variant",
              required: true,
              options: row.menu_item_variants
                .sort(
                  (a: any, b: any) =>
                    (a.sort_order ?? 0) - (b.sort_order ?? 0)
                )
                .map((variant: any) => ({
                  id: variant.id,
                  name: variant.name,
                  price_modifier:
                    Number(variant.price ?? basePrice) - basePrice,
                })),
            },
          ];
        }

        const add_ons =
          row.menu_item_addons && row.menu_item_addons.length > 0
            ? row.menu_item_addons
                .filter((addon: any) => addon.is_available !== false)
                .sort(
                  (a: any, b: any) =>
                    (a.sort_order ?? 0) - (b.sort_order ?? 0)
                )
                .map((addon: any) => ({
                  id: addon.id,
                  name: addon.name,
                  price: Number(addon.price ?? 0),
                }))
            : undefined;

        return {
          id: row.id,
          name: row.name,
          description: row.description ?? undefined,
          price: Number(row.price ?? 0),
          image_url: row.image_url ?? undefined,
          category_id: row.category_id,
          is_available: row.is_available ?? true,
          is_featured: row.is_featured ?? false,
          preparation_time: row.preparation_time ?? undefined,
          variations,
          add_ons,
          created_at: row.created_at,
          updated_at: row.updated_at,
        } as MenuItem;
      }) ?? [];

    return NextResponse.json(
      {
        categories,
        items,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("[API /menu] Unexpected error", error);
    return NextResponse.json(
      { error: "Unexpected error while fetching menu" },
      { status: 500 }
    );
  }
}

