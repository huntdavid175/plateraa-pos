"use client";

import { useState, useMemo } from "react";
import { mockKitchenOrders } from "@/lib/mock-orders";
import { Order } from "@/types";
import { KitchenOrderCard } from "@/components/kitchen/KitchenOrderCard";
import { Navigation } from "@/components/shared/Navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

type OrderStatusFilter = "all" | "pending" | "preparing" | "ready" | "completed";

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>(mockKitchenOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");

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

  const handleStatusUpdate = (orderId: string, newStatus: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus, updated_at: new Date().toISOString() }
          : order
      )
    );

    const order = orders.find((o) => o.id === orderId);
    if (order) {
      toast.success(`Order #${order.order_number} marked as ${newStatus}`);
    }
  };

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

