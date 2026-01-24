"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Check, XCircle, Clock, MapPin, User, ChevronLeft, ChevronRight, Bike } from "lucide-react";
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
  estimatedDeliveryTime: number;
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
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentOrder = orders[currentOrderIndex] || null;
  const pendingCount = orders.length;

  // Initialize audio on mount
  useEffect(() => {
    audioRef.current = new Audio('/sound/new_order.mp3');
    audioRef.current.volume = 0.7;
  }, []);

  // Play notification sound when new orders come in
  useEffect(() => {
    const currentOrderIds = new Set(orders.map(o => o.id));
    const previousOrderIds = previousOrderIdsRef.current;
    
    // Check if there are any new orders
    const newOrders = orders.filter(o => !previousOrderIds.has(o.id));
    
    if (newOrders.length > 0) {
      // Play notification sound for new orders
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.log('Could not play notification sound:', err);
        });
      }
      
      // Set up timers for new orders
      setTimeRemaining(prev => {
        const updated = { ...prev };
        newOrders.forEach((order) => {
          updated[order.id] = 30;
        });
        return updated;
      });
    }
    
    if (orders.length > 0) {
      setIsVisible(true);
      if (newOrders.length > 0) {
        setCurrentOrderIndex(0);
      }
    } else {
      setIsVisible(false);
    }
    
    // Update the ref with current order IDs
    previousOrderIdsRef.current = currentOrderIds;
  }, [orders]);

  useEffect(() => {
    if (orders.length > 0 && currentOrderIndex >= orders.length) {
      setCurrentOrderIndex(0);
    }
  }, [orders.length, currentOrderIndex]);

  useEffect(() => {
    if (!isVisible || orders.length === 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        orders.forEach((order) => {
          if (updated[order.id] !== undefined) {
            if (updated[order.id] <= 1) {
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
  const timerPercentage = (currentTimeRemaining / 30) * 100;
  const isUrgent = currentTimeRemaining <= 10;

  const handleAccept = () => {
    onAccept(currentOrder.id);
    if (orders.length > 1) {
      const nextIndex = currentOrderIndex < orders.length - 1 ? currentOrderIndex + 1 : 0;
      setCurrentOrderIndex(nextIndex);
    }
  };

  const handleDecline = () => {
    onDecline(currentOrder.id);
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
          "fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Notification */}
      <div
        className={cn(
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-sm mx-4",
          "animate-in zoom-in-95 fade-in-0 duration-200"
        )}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl border border-white/10">
          {/* Animated gradient border */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 opacity-20 blur-xl" />
          
          {/* Header */}
          <div className="relative p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center",
                  isUrgent && "animate-pulse"
                )}>
                  <Bike className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm">New Order</h3>
                    {pendingCount > 1 && (
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-white/80">
                        +{pendingCount - 1} more
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60">#{currentOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-white/60" />
              </button>
            </div>

            {/* Timer bar */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-linear",
                    isUrgent ? "bg-red-500" : "bg-gradient-to-r from-emerald-400 to-cyan-500"
                  )}
                  style={{ width: `${timerPercentage}%` }}
                />
              </div>
              <span className={cn(
                "text-xs font-mono font-bold min-w-[32px] text-right",
                isUrgent ? "text-red-400" : "text-white/80"
              )}>
                {currentTimeRemaining}s
              </span>
            </div>

            {/* Navigation dots */}
            {pendingCount > 1 && (
              <div className="flex items-center justify-center gap-3 mt-3">
                <button onClick={handlePrevOrder} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <ChevronLeft className="h-3 w-3 text-white/60" />
                </button>
                <div className="flex gap-1">
                  {orders.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-1 rounded-full transition-all",
                        index === currentOrderIndex ? "w-4 bg-emerald-400" : "w-1 bg-white/20"
                      )}
                    />
                  ))}
                </div>
                <button onClick={handleNextOrder} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <ChevronRight className="h-3 w-3 text-white/60" />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="relative p-4 space-y-4">
            {/* Customer */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{currentOrder.customerName}</p>
                <p className="text-xs text-white/50">{currentOrder.customerPhone}</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-2 text-xs text-white/60">
              <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-1">{currentOrder.deliveryAddress}</span>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Order Items</p>
              <div className="flex flex-wrap gap-1.5">
                {currentOrder.items.map((item, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 rounded-lg bg-white/5 text-xs text-white/80 border border-white/10"
                  >
                    {item.quantity}× {item.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-white/60">{currentOrder.estimatedDeliveryTime} min</span>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40 uppercase">Total</p>
                <p className="text-lg font-bold text-white">₵{currentOrder.total}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="relative p-4 pt-0 flex gap-2">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1 h-11 bg-transparent border-white/10 text-white/80 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400"
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-emerald-500/25"
            >
              <Check className="h-4 w-4 mr-1.5" />
              Accept
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
