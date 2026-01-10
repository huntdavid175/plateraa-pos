"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Check, XCircle, Clock, MapPin, User, Phone, ShoppingBag, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoltFoodOrder {
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
  estimatedDeliveryTime: number; // in minutes
  createdAt: string;
}

interface BoltFoodOrderNotificationProps {
  orders: BoltFoodOrder[];
  onAccept: (orderId: string) => void;
  onDecline: (orderId: string) => void;
  onClose?: () => void;
}

export function BoltFoodOrderNotification({
  orders,
  onAccept,
  onDecline,
  onClose,
}: BoltFoodOrderNotificationProps) {
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});
  const [isVisible, setIsVisible] = useState(false);

  const currentOrder = orders[currentOrderIndex] || null;
  const pendingCount = orders.length;

  useEffect(() => {
    if (orders.length > 0) {
      setIsVisible(true);
      setCurrentOrderIndex(0);
      // Initialize timers for all orders
      const timers: Record<string, number> = {};
      orders.forEach((order) => {
        timers[order.id] = 30;
      });
      setTimeRemaining(timers);
    } else {
      setIsVisible(false);
    }
  }, [orders.length]);

  // Update current order index when orders change
  useEffect(() => {
    if (orders.length > 0 && currentOrderIndex >= orders.length) {
      setCurrentOrderIndex(0);
    }
  }, [orders.length, currentOrderIndex]);

  // Timer for all orders
  useEffect(() => {
    if (!isVisible || orders.length === 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        orders.forEach((order) => {
          if (updated[order.id] !== undefined) {
            if (updated[order.id] <= 1) {
              // Auto-decline if time runs out
              onDecline(order.id);
              delete updated[order.id];
              hasChanges = true;
            } else {
              updated[order.id] = updated[order.id] - 1;
              hasChanges = true;
            }
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, orders, onDecline]);

  if (!currentOrder || !isVisible || orders.length === 0) return null;

  const currentTimeRemaining = timeRemaining[currentOrder.id] || 0;

  const handleAccept = () => {
    onAccept(currentOrder.id);
    // Move to next order if available
    if (orders.length > 1) {
      const nextIndex = currentOrderIndex < orders.length - 1 ? currentOrderIndex + 1 : 0;
      setCurrentOrderIndex(nextIndex);
    }
  };

  const handleDecline = () => {
    onDecline(currentOrder.id);
    // Move to next order if available
    if (orders.length > 1) {
      const nextIndex = currentOrderIndex < orders.length - 1 ? currentOrderIndex + 1 : 0;
      setCurrentOrderIndex(nextIndex);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleNextOrder = () => {
    if (orders.length > 1) {
      setCurrentOrderIndex((prev) => (prev + 1) % orders.length);
    }
  };

  const handlePrevOrder = () => {
    if (orders.length > 1) {
      setCurrentOrderIndex((prev) => (prev - 1 + orders.length) % orders.length);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Notification Card */}
      <div
        className={cn(
          "fixed top-4 left-1/2 -translate-x-1/2 z-[101] w-full max-w-md mx-4",
          "animate-in slide-in-from-top-5 fade-in-0 zoom-in-95 duration-300"
        )}
      >
            <Card className="relative overflow-hidden border-2 border-primary shadow-2xl">
              {/* Bolt Food Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">New Bolt Food Order</h3>
                        {pendingCount > 1 && (
                          <Badge className="bg-white/20 text-white border-white/30">
                            {pendingCount} pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-white/90">Order #{currentOrder.orderNumber}</p>
                        {pendingCount > 1 && (
                          <span className="text-xs text-white/70">
                            ({currentOrderIndex + 1} of {pendingCount})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-1 hover:bg-white/20 rounded-md transition-colors flex-shrink-0"
                    aria-label="Close notification"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Navigation for multiple orders */}
                {pendingCount > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-3">
                    <button
                      onClick={handlePrevOrder}
                      className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                      aria-label="Previous order"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex gap-1">
                      {orders.map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "h-2 rounded-full transition-all",
                            index === currentOrderIndex
                              ? "w-6 bg-white"
                              : "w-2 bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleNextOrder}
                      className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                      aria-label="Next order"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Timer */}
                <div className="flex items-center gap-2 mt-3">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Respond in: <span className="font-bold">{currentTimeRemaining}s</span>
                  </span>
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-[30000ms] ease-linear"
                      style={{ width: `${(currentTimeRemaining / 30) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-4 space-y-4 bg-background">
                {/* Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{currentOrder.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{currentOrder.customerPhone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="flex-1">{currentOrder.deliveryAddress}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  {/* Order Items */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      <ShoppingBag className="h-4 w-4" />
                      <span>Order Items</span>
                    </div>
                    {currentOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm bg-muted/50 p-2 rounded"
                      >
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium">₵{item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="space-y-1 border-t pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₵{currentOrder.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>₵{currentOrder.deliveryFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base pt-1 border-t">
                      <span>Total</span>
                      <span className="text-primary">₵{currentOrder.total.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Estimated Time */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Estimated delivery: <span className="font-medium">{currentOrder.estimatedDeliveryTime} min</span>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    className="flex-1 h-12 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Decline
                  </Button>
                  <Button
                    onClick={handleAccept}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Accept Order
                  </Button>
                </div>
              </div>
            </Card>
          </div>
    </>
  );
}

