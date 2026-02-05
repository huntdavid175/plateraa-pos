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
import { BoltFoodOrderNotification } from "@/components/pos/BoltFoodOrderNotification";
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
  const [boltFoodOrders, setBoltFoodOrders] = useState<any[]>([]);

  const TAX_RATE = 0.1; // 10% tax

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

  // Fetch categories and menu items for the resolved institution
  useEffect(() => {
    if (!institutionId) return;

    const fetchMenuData = async () => {
      try {
        setIsLoadingMenu(true);

        // Fetch categories
        const { data: categoryRows, error: categoryError } = await supabase
          .from("menu_categories")
          .select("*")
          .eq("institution_id", institutionId)
          .eq("is_visible", true)
          .order("sort_order");

        if (categoryError) {
          console.error("Error fetching menu categories", categoryError);
          toast.error("Failed to load menu categories");
        } else if (categoryRows) {
          const mappedCategories: MenuCategory[] = categoryRows.map(
            (cat: any) => ({
              id: cat.id,
              name: cat.name,
              slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-"),
              icon: cat.icon || undefined,
              display_order: cat.sort_order ?? 0,
              created_at: cat.created_at,
            })
          );
          setCategories(mappedCategories);
        }

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
          console.error("Error fetching menu items", itemError);
          toast.error("Failed to load menu items");
          return;
        }

        if (!itemRows) {
          setMenuItems([]);
          return;
        }

        const mappedItems: MenuItem[] = itemRows.map((row: any) => {
          let variations: Variation[] | undefined;

          if (row.menu_item_variants && row.menu_item_variants.length > 0) {
            // Map Supabase variants into a single variation group called "Variant"
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
        });

        setMenuItems(mappedItems);
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchMenuData();
  }, [institutionId]);

  // Simulate incoming Bolt Food orders (for demo purposes)
  useEffect(() => {
    // Simulate multiple Bolt Food orders coming in
    const timers: NodeJS.Timeout[] = [];
    
    // First order after 5 seconds
    timers.push(setTimeout(() => {
      setBoltFoodOrders((prev) => [
        ...prev,
        {
          id: `bolt-${Date.now()}`,
          orderNumber: `BF${Math.floor(Math.random() * 10000)}`,
          customerName: "Kwame Mensah",
          customerPhone: "+233 24 123 4567",
          deliveryAddress: "123 Spintex Road, Accra",
          items: [
            { name: "Onigiri (Large)", quantity: 2, price: 18.9 },
            { name: "Tom Yum Soup (Hot)", quantity: 1, price: 9.5 },
          ],
          subtotal: 47.3,
          deliveryFee: 5.0,
          total: 52.3,
          estimatedDeliveryTime: 25,
          createdAt: new Date().toISOString(),
        },
      ]);
    }, 5000));

    // Second order after 7 seconds
    timers.push(setTimeout(() => {
      setBoltFoodOrders((prev) => [
        ...prev,
        {
          id: `bolt-${Date.now()}`,
          orderNumber: `BF${Math.floor(Math.random() * 10000)}`,
          customerName: "Ama Asante",
          customerPhone: "+233 24 987 6543",
          deliveryAddress: "45 East Legon, Accra",
          items: [
            { name: "Iced Coffee (Large)", quantity: 2, price: 6.0 },
            { name: "Dumplings (12 pieces)", quantity: 1, price: 23.0 },
          ],
          subtotal: 35.0,
          deliveryFee: 5.0,
          total: 40.0,
          estimatedDeliveryTime: 20,
          createdAt: new Date().toISOString(),
        },
      ]);
    }, 7000));

    // Third order after 9 seconds
    timers.push(setTimeout(() => {
      setBoltFoodOrders((prev) => [
        ...prev,
        {
          id: `bolt-${Date.now()}`,
          orderNumber: `BF${Math.floor(Math.random() * 10000)}`,
          customerName: "Kofi Adjei",
          customerPhone: "+233 24 555 1234",
          deliveryAddress: "78 Osu, Oxford Street, Accra",
          items: [
            { name: "Songpyeon", quantity: 3, price: 4.9 },
            { name: "Miso Soup", quantity: 2, price: 5.5 },
          ],
          subtotal: 25.7,
          deliveryFee: 5.0,
          total: 30.7,
          estimatedDeliveryTime: 18,
          createdAt: new Date().toISOString(),
        },
      ]);
    }, 9000));

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const handleAcceptBoltOrder = useCallback((orderId: string) => {
    console.log("Bolt Food order accepted:", orderId);
    setBoltFoodOrders((prev) => prev.filter((order) => order.id !== orderId));
    toast.success("Order Accepted: Bolt Food order has been accepted and sent to kitchen");
  }, []);

  const handleDeclineBoltOrder = useCallback((orderId: string) => {
    console.log("Bolt Food order declined:", orderId);
    setBoltFoodOrders((prev) => prev.filter((order) => order.id !== orderId));
    toast.error("Order Declined: Bolt Food order has been declined");
  }, []);

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
      if (orderItems.length === 0) {
        toast.error("Empty Order: Please add items to your order");
        return;
      }

      // For cash orders, customer is optional - create default if not provided
      const orderCustomer = customer || {
        id: "walk-in",
        name: "Walk-in Customer",
        phone: "",
        created_at: new Date().toISOString(),
      };

      if (orderType === "delivery" && !deliveryAddress) {
        toast.error("Delivery Address Required: Please enter delivery address");
        return;
      }

      // Simulate order placement (no database)
      const subtotal = orderItems.reduce(
        (sum, item) => sum + item.subtotal,
        0
      );
      const taxAmount = subtotal * TAX_RATE;
      const total = subtotal + taxAmount;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Order placed:", {
        order_number: orderNumber,
        order_type: orderType,
        customer: orderCustomer.name,
        items: orderItems,
        total,
        payment_method: paymentMethod,
      });

      // Simulate sending to kitchen
      console.log("Order sent to kitchen:", orderNumber);

      // Clear cart
      setOrderItems([]);
      setCustomer(null);
      setTableNumber("");
      setDeliveryAddress("");

      toast.success("Order created and sent to kitchen");
    },
    [
      orderItems,
      customer,
      orderType,
      tableNumber,
      deliveryAddress,
      TAX_RATE,
    ]
  );

  // Send payment link
  const handleSendPaymentLink = useCallback(async (phoneNumber?: string) => {
    if (orderItems.length === 0) {
      toast.error("Invalid Order: Please add items to the order");
      return;
    }

    if (!phoneNumber) {
      toast.error("Phone Number Required: Please enter customer phone number");
      return;
    }

    // Simulate payment link generation
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    const taxAmount = subtotal * TAX_RATE;
    const total = subtotal + taxAmount;

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate payment link (mock)
    const paymentLink = `https://pay.example.com/pay/${Date.now()}`;
    console.log("Payment link generated:", paymentLink);
    console.log("Sending to phone:", phoneNumber);

    // Clear the cart after successful payment link sending
    setOrderItems([]);
    setCustomer(null);
    setTableNumber("");
    setDeliveryAddress("");

    toast.success("Order created and payment link sent");
  }, [orderItems, TAX_RATE]);

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
          <button
            onClick={() => {
              setBoltFoodOrders((prev) => [
                ...prev,
                {
                  id: `bolt-${Date.now()}`,
                  orderNumber: `BF${Math.floor(Math.random() * 10000)}`,
                  customerName: "Kwame Mensah",
                  customerPhone: "+233 24 123 4567",
                  deliveryAddress: "123 Spintex Road, Accra",
                  items: [
                    { name: "Onigiri (Large)", quantity: 2, price: 18.9 },
                    { name: "Tom Yum Soup (Hot)", quantity: 1, price: 9.5 },
                    { name: "Iced Coffee (Large)", quantity: 1, price: 6.0 },
                  ],
                  subtotal: 53.3,
                  deliveryFee: 5.0,
                  total: 58.3,
                  estimatedDeliveryTime: 25,
                  createdAt: new Date().toISOString(),
                },
              ]);
            }}
            className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            title="Test Bolt Food Order"
          >
            Test Bolt Order
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
            taxRate={TAX_RATE}
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

      {/* Bolt Food Order Notification */}
      <BoltFoodOrderNotification
        orders={boltFoodOrders}
        onAccept={handleAcceptBoltOrder}
        onDecline={handleDeclineBoltOrder}
      />
    </div>
  );
}

