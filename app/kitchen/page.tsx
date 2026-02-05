"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Order, Customer, OrderItem } from "@/types";
import { KitchenOrderCard } from "@/components/kitchen/KitchenOrderCard";
import { Navigation } from "@/components/shared/Navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type OrderStatusFilter = "all" | "pending" | "preparing" | "ready" | "completed";

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");

  // Map UI order status to DB status enum used in `orders` and `order_timeline`
  const mapUiStatusToDbStatus = (
    status: Order["status"]
  ):
    | "pending"
    | "paid"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled" => {
    switch (status) {
      case "pending":
        return "pending";
      case "confirmed":
        return "paid";
      case "preparing":
        return "preparing";
      case "ready":
        return "ready";
      case "completed":
        return "delivered";
      case "cancelled":
        return "cancelled";
      default:
        return "pending";
    }
  };

  // Fetch orders from Supabase
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);

      // Calculate today's date range (local time) for filtering orders
      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );

      const startIso = startOfDay.toISOString();
      const endIso = endOfDay.toISOString();

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers (*),
          order_items (
            *,
            order_item_addons (*)
          )
        `
        )
        .gte("created_at", startIso)
        .lte("created_at", endIso)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load kitchen orders");
        return;
      }

      if (!data) {
        setOrders([]);
        return;
      }

      const mappedOrders: Order[] = data.map((row: any) => {
        const customer: Customer | undefined = row.customers
          ? {
              id: row.customers.id,
              name: row.customers.name,
              phone: row.customers.phone,
              email: row.customers.email ?? undefined,
              address: row.customers.address ?? undefined,
              created_at: row.customers.created_at,
            }
          : undefined;

        // Map normalized order_items + order_item_addons into our UI OrderItem shape
        const rawItems: any[] = Array.isArray(row.order_items)
          ? row.order_items
          : [];

        const items: OrderItem[] = rawItems.map((item: any) => {
          const addOns =
            Array.isArray(item.order_item_addons) &&
            item.order_item_addons.length > 0
              ? item.order_item_addons.map((addon: any) => ({
                  add_on_id: addon.id as string,
                  name: addon.addon_name as string,
                  price: Number(addon.addon_price ?? 0),
                }))
              : undefined;

          const quantity = Number(item.quantity ?? 1);
          const unitPrice = Number(item.unit_price ?? 0);
          const subtotal = Number(
            item.total_price ?? unitPrice * quantity
          );

          // We may not have a full menu_item record here, so build a minimal placeholder
          const menuItem = {
            id: (item.menu_item_id as string) ?? "",
            name: (item.item_name as string) ?? "Item",
            description: (item.notes as string | null) ?? undefined,
            price: unitPrice,
            image_url: undefined,
            category_id: "",
            is_available: true,
            is_featured: false,
            preparation_time: undefined,
            variations: undefined,
            add_ons: undefined,
            created_at: row.created_at as string,
            updated_at: row.updated_at as string,
          };

          return {
            id: item.id as string,
            menu_item_id: (item.menu_item_id as string) ?? "",
            menu_item: menuItem,
            quantity,
            price: unitPrice,
            selected_variations: item.variant_name
              ? [
                  {
                    variation_id: "variant",
                    variation_name: "Variant",
                    option_id: "variant-option",
                    option_name: item.variant_name as string,
                    price_modifier: 0,
                  },
                ]
              : undefined,
            selected_add_ons: addOns,
            special_instructions:
              (item.notes as string | null) ?? undefined,
            subtotal,
          };
        });

        // Map delivery_type from API schema to our local OrderType union
        const deliveryType = (row.delivery_type || "") as
          | "delivery"
          | "pickup"
          | "dine_in"
          | "";

        const derivedOrderType: Order["order_type"] =
          deliveryType === "delivery"
            ? "delivery"
            : deliveryType === "pickup"
            ? "takeaway"
            : deliveryType === "dine_in"
            ? "dine-in"
            : "dine-in";

        // Map channel / payment_method to our limited union
        const rawPaymentMethod = (row.payment_method ||
          row.channel ||
          "") as
          | "cash"
          | "card"
          | "mobile_money"
          | "bank_transfer"
          | "";

        const derivedPaymentMethod: Order["payment_method"] | undefined =
          rawPaymentMethod === "cash"
            ? "cash"
            : rawPaymentMethod === "card"
            ? "card"
            : rawPaymentMethod === "mobile_money"
            ? "mobile_money"
            : // For bank_transfer or anything else, just leave undefined for now
              undefined;

        // Derive a payment_status if the column is not explicitly present
        const derivedPaymentStatus: Order["payment_status"] =
          (row.payment_status as Order["payment_status"]) ??
          (row.status === "paid" ? "paid" : "pending");

        // Map external status values to our internal union
        const rawStatus = (row.status || "") as
          | "pending"
          | "paid"
          | "preparing"
          | "ready"
          | "delivered"
          | "cancelled"
          | string;

        const mappedStatus: Order["status"] =
          rawStatus === "pending"
            ? "pending"
            : rawStatus === "paid"
            ? "confirmed"
            : rawStatus === "preparing"
            ? "preparing"
            : rawStatus === "ready"
            ? "ready"
            : rawStatus === "delivered"
            ? "completed"
            : rawStatus === "cancelled"
            ? "cancelled"
            : "pending";

        return {
          id: row.id,
          order_number: row.order_number,
          order_type: derivedOrderType,
          customer_id: row.customer_id ?? undefined,
          customer,
          table_number: row.table_number ?? undefined,
          delivery_address: row.delivery_address ?? undefined,
          items,
          subtotal: Number(row.subtotal ?? 0),
          tax_rate: Number(row.tax_rate ?? 0),
          tax_amount: Number(row.tax_amount ?? 0),
          total: Number(row.total_amount ?? row.total ?? 0),
          status: mappedStatus,
          payment_method: derivedPaymentMethod,
          payment_status: derivedPaymentStatus,
          payment_link: row.payment_link ?? undefined,
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
      });
      setOrders(mappedOrders);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.customer?.name.toLowerCase().includes(query) ||
          order.customer?.phone.toLowerCase().includes(query) ||
          order.items.some((item) =>
            item.menu_item.name.toLowerCase().includes(query)
          )
      );
    }

    // Sort by created_at (newest first)
    return [...filtered].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders, statusFilter, searchQuery]);

  const handleStatusUpdate = useCallback(
    async (orderId: string, newStatus: Order["status"]) => {
      const target = orders.find((o) => o.id === orderId);
      if (!target) return;

      const previousStatus = target.status;

      // Optimistic update
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
            : order
        )
      );

      const dbStatus = mapUiStatusToDbStatus(newStatus);
      const nowIso = new Date().toISOString();

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: dbStatus,
          updated_at: nowIso,
        })
        .eq("id", orderId);

      if (orderError) {
        // Revert on failure
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: previousStatus } : order
          )
        );
        toast.error(
          `Failed to update order status: ${orderError.message ?? "Please try again."}`
        );
        return;
      }

      // Best-effort: record status change in order_timeline
      const eventDescription = `Status changed to "${dbStatus}" from kitchen`;
      const { error: timelineError } = await supabase.from("order_timeline").insert({
        order_id: orderId,
        event_type: dbStatus,
        event_description: eventDescription,
      });

      if (timelineError) {
        // Don't revert the status; just ignore the timeline failure.
      }

      toast.success(`Order #${target.order_number} marked as ${newStatus}`);
    },
    [orders]
  );

  const getOrderCounts = () => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending" || o.status === "confirmed").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      completed: orders.filter((o) => o.status === "completed").length,
    };
  };

  const counts = getOrderCounts();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Navigation />
          <h1 className="text-xl font-bold">Kitchen View</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={isLoading}
            className="text-xs"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Filters and Search */}
        <div className="border-b bg-card p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search orders by number, customer, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Status Tabs */}
          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as OrderStatusFilter)}
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                All ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm">
                Pending ({counts.pending})
              </TabsTrigger>
              <TabsTrigger value="preparing" className="text-xs sm:text-sm">
                Preparing ({counts.preparing})
              </TabsTrigger>
              <TabsTrigger value="ready" className="text-xs sm:text-sm">
                Ready ({counts.ready})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm">
                Completed ({counts.completed})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Orders Grid */}
        <div className="flex-1 overflow-auto p-4">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No orders found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search"
                  : "No orders match the selected filter"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

