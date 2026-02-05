"use client";

import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-toastify";

interface RealtimeContextType {
  isConnected: boolean;
  subscribeToOrders: (callback: (payload: any) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const channelRef = useRef<any>(null);
  const isConnectedRef = useRef(false);
  const subscribersRef = useRef<Set<(payload: any) => void>>(new Set());

  const handleRealtimeEvent = useCallback((payload: any) => {
    console.log("[Realtime] Order event received:", {
      eventType: payload.eventType,
      table: payload.table,
      schema: payload.schema,
      new: payload.new,
      old: payload.old,
      timestamp: new Date().toISOString(),
    });

    // Notify all subscribers
    subscribersRef.current.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        console.error("[Realtime] Error in subscriber callback:", error);
      }
    });
  }, []);

  useEffect(() => {
    // Create and subscribe to realtime channel
    const channel = supabase
      .channel("global-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        handleRealtimeEvent
      )
      .subscribe((status) => {
        isConnectedRef.current = status === "SUBSCRIBED";
        
        console.log("[Realtime] Connection status:", status);
        
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] ✅ Connected to orders table");
        } else if (status === "CHANNEL_ERROR") {
          console.error("[Realtime] ❌ Connection error");
        } else if (status === "TIMED_OUT") {
          console.warn("[Realtime] ⏱️ Connection timed out");
        } else if (status === "CLOSED") {
          console.warn("[Realtime] 🔌 Connection closed");
        }
      });

    channelRef.current = channel;

    return () => {
      console.log("[Realtime] Cleaning up connection");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        isConnectedRef.current = false;
      }
    };
  }, [handleRealtimeEvent]);

  const subscribeToOrders = useCallback((callback: (payload: any) => void) => {
    subscribersRef.current.add(callback);
    console.log("[Realtime] Subscriber added, total subscribers:", subscribersRef.current.size);

    // Return unsubscribe function
    return () => {
      subscribersRef.current.delete(callback);
      console.log("[Realtime] Subscriber removed, total subscribers:", subscribersRef.current.size);
    };
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected: isConnectedRef.current,
        subscribeToOrders,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}
