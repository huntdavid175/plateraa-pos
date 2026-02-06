"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/contexts/RealtimeContext";
import { BoltFoodOrderNotification } from "@/components/pos/BoltFoodOrderNotification";

type NotificationOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  estimatedDeliveryTime: number;
  createdAt: string;
};

export function GlobalOrderNotificationHost() {
  const { subscribeToOrders } = useRealtime();
  const [notificationOrders, setNotificationOrders] = useState<NotificationOrder[]>([]);

  const queueNotificationForOrder = useCallback(async (orderId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        customers (*),
        order_items (*)
      `
      )
      .eq("id", orderId)
      .single();

    if (error || !data) return;

    const row: any = data;

    const items = Array.isArray(row.order_items)
      ? row.order_items.map((item: any) => ({
          name: (item.item_name as string) ?? "Item",
          quantity: Number(item.quantity ?? 1),
          price: Number(item.unit_price ?? 0),
        }))
      : [];

    const notificationOrder: NotificationOrder = {
      id: row.id as string,
      orderNumber: row.order_number as string,
      customerName: (row.customer_name as string) ?? "Customer",
      customerPhone: (row.customer_phone as string) ?? "",
      deliveryAddress: (row.delivery_address as string) ?? "",
      items,
      subtotal: Number(row.subtotal ?? 0),
      deliveryFee: Number(row.delivery_fee ?? 0),
      total: Number(row.total_amount ?? 0),
      estimatedDeliveryTime: 30,
      createdAt: row.created_at as string,
    };

    setNotificationOrders((prev) => {
      if (prev.some((o) => o.id === notificationOrder.id)) return prev;
      return [...prev, notificationOrder];
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(async (payload: any) => {
      const eventType = payload.eventType;
      const newRow = payload.new as any | null;
      const oldRow = payload.old as any | null;

      if (!newRow) return;

      // Only notify when payment_status becomes 'paid'
      const paymentStatus = (newRow.payment_status || "pending") as
        | "pending"
        | "paid"
        | string;

      const wasPreviouslyPaid =
        (oldRow?.payment_status as "pending" | "paid" | string | null) === "paid";
      const isNowPaid = paymentStatus === "paid";
      const isNewOrder = eventType === "INSERT";

      if (isNowPaid && (isNewOrder || !wasPreviouslyPaid)) {
        await queueNotificationForOrder(newRow.id as string);
      }
    });

    return unsubscribe;
  }, [subscribeToOrders, queueNotificationForOrder]);

  if (notificationOrders.length === 0) {
    return null;
  }

  return (
    <BoltFoodOrderNotification
      orders={notificationOrders}
      onAccept={(orderId) =>
        setNotificationOrders((prev) => prev.filter((o) => o.id !== orderId))
      }
      onDecline={(orderId) =>
        setNotificationOrders((prev) => prev.filter((o) => o.id !== orderId))
      }
    />
  );
}

