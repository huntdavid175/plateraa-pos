"use client";

import { Order } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  MapPin,
  User,
  Phone,
  Utensils,
  CheckCircle2,
  ChefHat,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface KitchenOrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: Order["status"]) => void;
}

const statusConfig: Record<
  Order["status"],
  { label: string; color: string; nextStatus?: Order["status"]; nextLabel?: string }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500",
    nextStatus: "preparing",
    nextLabel: "Start Preparing",
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-500",
    nextStatus: "preparing",
    nextLabel: "Start Preparing",
  },
  preparing: {
    label: "Preparing",
    color: "bg-orange-500",
    nextStatus: "ready",
    nextLabel: "Mark Ready",
  },
  ready: {
    label: "Ready",
    color: "bg-green-500",
    nextStatus: "completed",
    nextLabel: "Complete Order",
  },
  completed: {
    label: "Completed",
    color: "bg-gray-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500",
  },
};

export function KitchenOrderCard({ order, onStatusUpdate }: KitchenOrderCardProps) {
  const config =
    statusConfig[order.status] ??
    ({
      label: order.status || "Unknown",
      color: "bg-gray-500",
    } as const);
  const timeAgo = formatDistanceToNow(new Date(order.created_at), { addSuffix: true });

  const getOrderTypeIcon = () => {
    switch (order.order_type) {
      case "dine-in":
        return <Utensils className="h-4 w-4" />;
      case "delivery":
        return <MapPin className="h-4 w-4" />;
      case "takeaway":
        return <Package className="h-4 w-4" />;
    }
  };

  const getOrderTypeLabel = () => {
    switch (order.order_type) {
      case "dine-in":
        return "Dine-in";
      case "delivery":
        return "Delivery";
      case "takeaway":
        return "Takeaway";
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold">#{order.order_number}</h3>
            <Badge className={cn("text-white", config.color)}>
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
            </div>
            <div className="flex items-center gap-1">
              {getOrderTypeIcon()}
              <span>{getOrderTypeLabel()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      {order.customer && (
        <div className="space-y-1 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{order.customer.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{order.customer.phone}</span>
          </div>
        </div>
      )}

      {/* Order Details */}
      {order.table_number && (
        <div className="mb-4">
          <Badge variant="outline" className="text-sm">
            Table {order.table_number}
          </Badge>
        </div>
      )}

      {order.delivery_address && (
        <div className="mb-4 flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span className="text-muted-foreground">{order.delivery_address}</span>
        </div>
      )}

      {/* Order Items */}
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-semibold">Items:</h4>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="bg-muted/50 p-2 rounded text-sm"
          >
            {/*
              Some orders from the database may not have a full `menu_item` object.
              Fall back to a plain `name` field if needed.
            */}
            {(() => {
              const itemName =
                item.menu_item?.name ?? (item as any).name ?? "Item";
              const itemSubtotal =
                item.subtotal ?? (item as any).price ?? 0;

              return (
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">
                    {item.quantity}x {itemName}
              </span>
              <span className="text-muted-foreground">
                    ₵{Number(itemSubtotal).toLocaleString()}
              </span>
            </div>
              );
            })()}
            {item.selected_variations && item.selected_variations.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {item.selected_variations.map((v) => (
                  <div key={v.variation_id}>
                    {v.variation_name}: {v.option_name}
                  </div>
                ))}
              </div>
            )}
            {item.selected_add_ons && item.selected_add_ons.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                Add-ons: {item.selected_add_ons.map((a) => a.name).join(", ")}
              </div>
            )}
            {item.special_instructions && (
              <div className="text-xs text-muted-foreground mt-1 italic">
                Note: {item.special_instructions}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <span className="text-sm font-semibold">Total:</span>
        <span className="text-lg font-bold text-primary">
          ₵{order.total.toLocaleString()}
        </span>
      </div>

      {/* Action Button */}
      {config.nextStatus && (
        <Button
          onClick={() => onStatusUpdate(order.id, config.nextStatus!)}
          className="w-full"
          variant={order.status === "ready" ? "default" : "default"}
        >
          {order.status === "preparing" && <ChefHat className="h-4 w-4 mr-2" />}
          {order.status === "ready" && <CheckCircle2 className="h-4 w-4 mr-2" />}
          {config.nextLabel}
        </Button>
      )}

      {order.status === "completed" && (
        <div className="text-center text-sm text-muted-foreground py-2">
          Order completed
        </div>
      )}
    </Card>
  );
}

