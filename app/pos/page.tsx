"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import {
  MenuItem,
  MenuCategory,
  OrderItem,
  OrderType,
  Customer,
  SelectedVariation,
  SelectedAddOn,
  Variation,
} from "@/types";
import { MenuGrid } from "@/components/pos/MenuGrid";
import { OrderSidebar } from "@/components/pos/OrderSidebar";
import { toast } from "react-toastify";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Navigation } from "@/components/shared/Navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const INSTITUTION_ID_STORAGE_KEY = "plateraa_institution_id";

export default function POSPage() {
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [isCheckingInstitution, setIsCheckingInstitution] = useState(true);
  const [institutionCode, setInstitutionCode] = useState("");
  const [isResolvingInstitution, setIsResolvingInstitution] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tableNumber, setTableNumber] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");

  const handleInstitutionLogout = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(INSTITUTION_ID_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error clearing institution id from localStorage", error);
    }

    // Reset institution-scoped state
    setInstitutionId(null);
    setMenuItems([]);
    setCategories([]);

    toast.success("Logged out: You can connect a different restaurant");
  }, []);

  // Check for stored institution ID on first load
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const storedId = window.localStorage.getItem(
          INSTITUTION_ID_STORAGE_KEY
        );
        if (storedId) {
          setInstitutionId(storedId);
        }
      }
    } catch (error) {
      console.error("Error reading institution id from localStorage", error);
    } finally {
      setIsCheckingInstitution(false);
    }
  }, []);

  // Resolve institution code -> institution id and store it
  const handleResolveInstitution = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const code = institutionCode.trim();
      if (!code) {
        toast.error("Institution Code Required: Please enter your code");
        return;
      }

      try {
        setIsResolvingInstitution(true);

        const { data, error } = await supabase
          .from("institution_codes")
          .select("institution_id")
          .eq("code", code)
          .single();

        if (error || !data?.institution_id) {
          console.error("Error resolving institution code", error);
          toast.error(
            "Invalid Code: We couldn't find an institution for that code"
          );
          return;
        }

        const resolvedId = data.institution_id as string;

        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              INSTITUTION_ID_STORAGE_KEY,
              resolvedId
            );
          }
        } catch (storageError) {
          console.error(
            "Error saving institution id to localStorage",
            storageError
          );
        }

        setInstitutionId(resolvedId);
        toast.success("Institution Connected: Menu will load shortly");
      } finally {
        setIsResolvingInstitution(false);
      }
    },
    [institutionCode]
  );

  // Fetch categories and menu items for the resolved institution (from server via ISR API)
  useEffect(() => {
    if (!institutionId) return;

    const fetchMenuData = async () => {
      try {
        setIsLoadingMenu(true);

        const params = new URLSearchParams({ institution_id: institutionId });
        const res = await fetch(`/api/menu?${params.toString()}`);

        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          console.error("Error fetching menu via API", errorBody);
          toast.error("Failed to load menu");
          setMenuItems([]);
          setCategories([]);
          return;
        }

        const data: { categories: MenuCategory[]; items: MenuItem[] } =
          await res.json();

        setCategories(data.categories || []);
        setMenuItems(data.items || []);
      } catch (error) {
        console.error("Unexpected error fetching menu", error);
        toast.error("Failed to load menu");
        setMenuItems([]);
        setCategories([]);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchMenuData();
  }, [institutionId]);

  // Generate unique ID for order items
  const generateOrderItemId = () => {
    return `order-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add item to cart
  const handleAddToCart = useCallback((
    item: MenuItem,
    options: {
      variations: SelectedVariation[];
      addOns: SelectedAddOn[];
      specialInstructions?: string;
    }
  ) => {
    if (!item.is_available) {
      toast.error(`Item Unavailable: ${item.name} is currently out of stock`);
      return;
    }

    // Calculate base price with variations and add-ons
    let itemPrice = item.price;
    
    // Add variation price modifiers
    options.variations.forEach((variation) => {
      itemPrice += variation.price_modifier;
    });

    // Add add-on prices
    options.addOns.forEach((addOn) => {
      itemPrice += addOn.price;
    });

    setOrderItems((prev) => {
      // Check if exact same item with same variations/add-ons exists
      const existingItem = prev.find((orderItem) => {
        if (orderItem.menu_item_id !== item.id) return false;
        
        // Compare variations
        const variationsMatch = JSON.stringify(orderItem.selected_variations || []) === 
          JSON.stringify(options.variations);
        
        // Compare add-ons
        const addOnsMatch = JSON.stringify(orderItem.selected_add_ons || []) === 
          JSON.stringify(options.addOns);
        
        return variationsMatch && addOnsMatch;
      });

      if (existingItem) {
        // Increase quantity of existing item
        return prev.map((orderItem) =>
          orderItem.id === existingItem.id
            ? {
                ...orderItem,
                quantity: orderItem.quantity + 1,
                subtotal: (orderItem.quantity + 1) * orderItem.price,
              }
            : orderItem
        );
      } else {
        // Add new item with variations and add-ons
        const newOrderItem: OrderItem = {
          id: generateOrderItemId(),
          menu_item_id: item.id,
          menu_item: item,
          quantity: 1,
          price: itemPrice,
          selected_variations: options.variations.length > 0 ? options.variations : undefined,
          selected_add_ons: options.addOns.length > 0 ? options.addOns : undefined,
          special_instructions: options.specialInstructions,
          subtotal: itemPrice,
        };
        return [...prev, newOrderItem];
      }
    });
  }, [toast]);

  // Update item quantity
  const handleQuantityChange = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity < 1) {
        handleRemoveItem(itemId);
        return;
      }

      setOrderItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                subtotal: quantity * item.price,
              }
            : item
        )
      );
    },
    []
  );

  // Remove item from cart
  const handleRemoveItem = useCallback((itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // Update special instructions
  const handleSpecialInstructions = useCallback(
    (itemId: string, instructions: string) => {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, special_instructions: instructions }
            : item
        )
      );
    },
    []
  );

  // Place order
  const handlePlaceOrder = useCallback(
    async (paymentMethod: "cash" | "card" | "mobile_money") => {
      if (!institutionId) {
        toast.error("Institution not connected: Please connect a restaurant");
        return;
      }

      if (orderItems.length === 0) {
        toast.error("Empty Order: Please add items to your order");
        return;
      }

      if (orderType === "delivery" && !deliveryAddress) {
        toast.error("Delivery Address Required: Please enter delivery address");
        return;
      }

      try {
        // Calculate totals (no tax, just subtotal + delivery fee)
        const subtotal = orderItems.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );
        
        // Calculate delivery fee (0 for pickup/dine-in, you can add logic for delivery)
        const deliveryFee = orderType === "delivery" ? 0 : 0; // TODO: Calculate based on distance/zone
        
        const total = subtotal + deliveryFee;

        // Prepare customer data
        // For cash payments, phone number is optional
        const customerName = customer?.name || "Walk-in Customer";
        const customerPhone = customer?.phone || (paymentMethod === "cash" ? "" : "");
        const customerEmail = customer?.email;
        const customerAddress = customer?.address || deliveryAddress;

        // Create order via API
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            institution_id: institutionId,
            order_type: orderType,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            customer_address: customerAddress,
            delivery_address: deliveryAddress || null,
            items: orderItems.map((item) => ({
              menu_item_id: item.menu_item_id,
              menu_item: {
                name: item.menu_item.name,
              },
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
              selected_variations: item.selected_variations,
              selected_add_ons: item.selected_add_ons,
              special_instructions: item.special_instructions,
            })),
            subtotal,
            delivery_fee: deliveryFee,
            total,
            payment_method: paymentMethod,
            channel: "pos", // POS orders always come from 'pos' channel
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Error creating order:", errorData);
          toast.error(
            errorData.error || "Failed to create order: Please try again"
          );
          return;
        }

        const data = await response.json();

        // Clear cart after successful order creation
        setOrderItems([]);
        setCustomer(null);
        setTableNumber("");
        setDeliveryAddress("");

        toast.success(
          `Order ${data.order.order_number} created and sent to kitchen`
        );
      } catch (error) {
        console.error("Unexpected error placing order:", error);
        toast.error("Failed to create order: Please try again");
      }
    },
    [
      institutionId,
      orderItems,
      customer,
      orderType,
      tableNumber,
      deliveryAddress,
    ]
  );

  // Send payment link
  const handleSendPaymentLink = useCallback(async (
    phoneNumber?: string,
    serviceProvider: "MTN" | "Vodafone" | "Airtel" = "MTN"
  ) => {
    if (!institutionId) {
      toast.error("Institution not connected: Please connect a restaurant");
      return;
    }

    if (orderItems.length === 0) {
      toast.error("Invalid Order: Please add items to the order");
      return;
    }

    if (!phoneNumber) {
      toast.error("Phone Number Required: Please enter customer phone number");
      return;
    }

    if (orderType === "delivery" && !deliveryAddress) {
      toast.error("Delivery Address Required: Please enter delivery address");
      return;
    }

      try {
        // Calculate totals (no tax, just subtotal + delivery fee)
        const subtotal = orderItems.reduce(
          (sum, item) => sum + item.subtotal,
          0
        );
        
        // Calculate delivery fee (0 for pickup/dine-in, you can add logic for delivery)
        const deliveryFee = orderType === "delivery" ? 0 : 0; // TODO: Calculate based on distance/zone
        
        const total = subtotal + deliveryFee;

        // Prepare customer data
        const customerName = customer?.name || "Customer";
        const customerEmail = customer?.email;
        const customerAddress = customer?.address || deliveryAddress;

        // Create order with payment_status = 'pending' (will be updated when payment is confirmed)
        const orderResponse = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            institution_id: institutionId,
            order_type: orderType,
            customer_name: customerName,
            customer_phone: phoneNumber,
            customer_email: customerEmail,
            customer_address: customerAddress,
            delivery_address: deliveryAddress || null,
            items: orderItems.map((item) => ({
              menu_item_id: item.menu_item_id,
              menu_item: {
                name: item.menu_item.name,
              },
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
              selected_variations: item.selected_variations,
              selected_add_ons: item.selected_add_ons,
              special_instructions: item.special_instructions,
            })),
            subtotal,
            delivery_fee: deliveryFee,
            total,
            payment_method: "mobile_money",
            channel: "pos", // POS orders always come from 'pos' channel
          }),
        });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        console.error("Error creating order:", errorData);
        toast.error(
          errorData.error || "Failed to create order: Please try again"
        );
        return;
      }

      const orderData = await orderResponse.json();
      const orderId = orderData.order.id;
      const orderNumber = orderData.order.order_number;

      // Initiate payment via Moolre
      const paymentResponse = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          amount: total,
          serviceProvider: serviceProvider,
          externalRef: orderId, // Use order ID as external reference
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json().catch(() => ({}));
        console.error("Error initiating payment:", errorData);
        toast.error(
          errorData.error || "Failed to initiate payment. Order created but payment not processed."
        );
        // Order was created, so we still show success but warn about payment
        toast.warning(
          `Order ${orderNumber} created. Please process payment manually.`
        );
        return;
      }

      const paymentData = await paymentResponse.json();

      // Clear the cart after successful order creation
      setOrderItems([]);
      setCustomer(null);
      setTableNumber("");
      setDeliveryAddress("");

      toast.success(
        `Order ${orderNumber} created. Payment request sent to ${phoneNumber} via ${serviceProvider}.`
      );
    } catch (error) {
      console.error("Unexpected error sending payment link:", error);
      toast.error("Failed to create order: Please try again");
    }
  }, [
    institutionId,
    orderItems,
    customer,
    orderType,
    tableNumber,
    deliveryAddress,
  ]);

  if (isCheckingInstitution) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="text-sm text-muted-foreground">
          Loading restaurant configuration...
        </span>
      </div>
    );
  }

  if (!institutionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="mb-2 text-base font-semibold">
            Connect Restaurant
          </h1>
          <p className="mb-4 text-xs text-muted-foreground">
            Enter your institution code to load the correct menu for this
            device.
          </p>
          <form onSubmit={handleResolveInstitution} className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="institution-code"
                className="text-xs font-medium text-foreground"
              >
                Institution Code
              </label>
              <input
                id="institution-code"
                type="text"
                value={institutionCode}
                onChange={(e) => setInstitutionCode(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-xs outline-none ring-0 focus-visible:border-primary"
                placeholder="e.g. BRANCH-1234"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              disabled={isResolvingInstitution}
              className={cn(
                "w-full rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors",
                isResolvingInstitution && "opacity-70 cursor-not-allowed"
              )}
            >
              {isResolvingInstitution ? "Connecting..." : "Connect"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Navigation />
          <h1 className="text-base md:text-sm lg:text-base font-bold">Plateraa POS</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleInstitutionLogout}
            className="hidden md:inline-flex px-3 py-1.5 text-[11px] rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Logout / Change Restaurant
          </button>
          <ThemeToggle />
          <div className="text-sm text-muted-foreground">
            Cashier: Admin
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Menu Grid */}
        <main className="flex-1 overflow-hidden">
          <MenuGrid
            items={menuItems}
            categories={categories}
            activeCategoryId={activeCategoryId}
            onAddToCart={handleAddToCart}
            onCategorySelect={setActiveCategoryId}
          />
        </main>

        {/* Right Sidebar - Order Details */}
        <aside className="w-96 border-l bg-card hidden lg:block overflow-hidden">
          <OrderSidebar
            orderItems={orderItems}
            orderType={orderType}
            customer={customer || undefined}
            tableNumber={tableNumber}
            deliveryAddress={deliveryAddress}
            deliveryFee={orderType === "delivery" ? 0 : 0}
            onOrderTypeChange={setOrderType}
            onCustomerChange={setCustomer}
            onTableNumberChange={setTableNumber}
            onDeliveryAddressChange={setDeliveryAddress}
            onQuantityChange={handleQuantityChange}
            onRemoveItem={handleRemoveItem}
            onSpecialInstructions={handleSpecialInstructions}
            onPlaceOrder={handlePlaceOrder}
            onSendPaymentLink={handleSendPaymentLink}
          />
        </aside>
      </div>

      {/* Mobile Order Summary (Bottom Sheet) */}
      {orderItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">
                {orderItems.length} item{orderItems.length !== 1 ? "s" : ""} in cart
              </span>
              <span className="text-lg font-bold text-primary">
                ₵
                {orderItems
                  .reduce((sum, item) => sum + item.subtotal, 0)
                  .toLocaleString()}
              </span>
            </div>
            <button
              onClick={() => {
                // Scroll to order sidebar or open it
                document.getElementById("mobile-order-sidebar")?.scrollIntoView();
              }}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md font-medium touch-manipulation"
            >
              View Order Details
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

