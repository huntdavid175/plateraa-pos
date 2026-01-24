"use client";

import { OrderItem as OrderItemType, OrderType, Customer } from "@/types";
import { OrderItem } from "./OrderItem";
import { CustomerInfoForm } from "./CustomerInfoForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Smartphone, Banknote, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { LocationAutocomplete } from "./LocationAutocomplete";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface OrderSidebarProps {
  orderItems: OrderItemType[];
  orderType: OrderType;
  customer?: Customer;
  tableNumber?: string;
  deliveryAddress?: string;
  taxRate: number;
  onOrderTypeChange: (type: OrderType) => void;
  onCustomerChange: (customer: Customer | null) => void;
  onTableNumberChange: (tableNumber: string) => void;
  onDeliveryAddressChange: (address: string) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onSpecialInstructions: (itemId: string, instructions: string) => void;
  onPlaceOrder: (
    paymentMethod: "cash" | "card" | "mobile_money"
  ) => Promise<void>;
  onSendPaymentLink: (phoneNumber?: string) => Promise<void>;
}

export function OrderSidebar({
  orderItems,
  orderType,
  customer,
  tableNumber,
  deliveryAddress,
  taxRate,
  onOrderTypeChange,
  onCustomerChange,
  onTableNumberChange,
  onDeliveryAddressChange,
  onQuantityChange,
  onRemoveItem,
  onSpecialInstructions,
  onPlaceOrder,
  onSendPaymentLink,
}: OrderSidebarProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "cash" | "mobile_money" | null
  >(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [mobileDeliveryAddress, setMobileDeliveryAddress] =
    useState<string>("");

  const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  // Can continue to next step (either place order for cash, or show form for mobile)
  const canContinue = orderItems.length > 0 && selectedPaymentMethod !== null;

  // Can finalize mobile payment (after form is filled)
  const canFinalizeMobilePayment =
    customerPhone.trim() &&
    /^(\+233|233|0)[2356]\d{8}$/.test(customerPhone.replace(/\s+/g, "")) &&
    (orderType !== "delivery" || mobileDeliveryAddress.trim().length > 0);

  const handleContinue = async () => {
    if (!selectedPaymentMethod) return;

    if (selectedPaymentMethod === "cash") {
      // For cash, place order directly
      try {
        await onPlaceOrder("cash");
        // Reset payment method after successful order
        setSelectedPaymentMethod(null);
      } catch (error) {
        console.error("Error processing payment:", error);
      }
    } else if (selectedPaymentMethod === "mobile_money") {
      // For mobile payment, show customer form
      setShowCustomerForm(true);
    }
  };

  const handleFinalizeMobilePayment = async () => {
    if (!canFinalizeMobilePayment) return;

    try {
      await onSendPaymentLink(customerPhone);
      // Reset form after successful submission
      setShowCustomerForm(false);
      setSelectedPaymentMethod(null);
      setCustomerPhone("");
      setMobileDeliveryAddress("");
    } catch (error) {
      console.error("Error processing payment:", error);
    }
  };

  return (
    <div className="flex flex-col h-full border-l bg-card">
      <div className="p-4 border-b">
        <h2 className="text-xl md:text-lg lg:text-xl font-bold mb-4">Order Details</h2>

        {/* Order Type Tabs */}
        <Tabs
          value={orderType}
          onValueChange={(value) => onOrderTypeChange(value as OrderType)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dine-in" className="text-xs sm:text-sm">
              Dine-in
            </TabsTrigger>
            <TabsTrigger value="takeaway" className="text-xs sm:text-sm">
              Takeaway
            </TabsTrigger>
            <TabsTrigger value="delivery" className="text-xs sm:text-sm">
              Delivery
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Order Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm md:text-xs lg:text-sm">
                Ordered Items ({orderItems.length})
              </h3>
            </div>

            {orderItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No items in cart
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add items from the menu
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <OrderItem
                    key={item.id}
                    item={item}
                    onQuantityChange={onQuantityChange}
                    onRemove={onRemoveItem}
                    onSpecialInstructions={onSpecialInstructions}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Payment Summary - Sticky Footer */}
      {orderItems.length > 0 && (
        <div className="border-t bg-background p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm md:text-xs lg:text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">₵{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm md:text-xs lg:text-sm">
              <span className="text-muted-foreground">
                Taxes ({Math.round(taxRate * 100)}%):
              </span>
              <span className="font-medium">₵{taxAmount.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg md:text-base lg:text-lg font-bold">
              <span>Total:</span>
              <span className="text-primary">₵{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          {!showCustomerForm && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedPaymentMethod("cash")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all touch-manipulation",
                    selectedPaymentMethod === "cash"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-card"
                  )}
                  aria-pressed={selectedPaymentMethod === "cash"}
                >
                  <Banknote className="h-6 w-6 mb-2" />
                  <span className="text-sm md:text-xs lg:text-sm font-medium">Cash</span>
                </button>
                <button
                  onClick={() => setSelectedPaymentMethod("mobile_money")}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all touch-manipulation",
                    selectedPaymentMethod === "mobile_money"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-card"
                  )}
                  aria-pressed={selectedPaymentMethod === "mobile_money"}
                >
                  <Smartphone className="h-6 w-6 mb-2" />
                  <span className="text-sm md:text-xs lg:text-sm font-medium">Mobile Payment</span>
                </button>
              </div>

              {/* Continue Button */}
              <Button
                className="w-full bg-primary hover:bg-primary/90 h-12 md:h-10 text-base md:text-sm lg:text-base font-medium"
                onClick={handleContinue}
                disabled={!canContinue}
              >
                Continue
              </Button>
            </>
          )}
        </div>
      )}

      {/* Mobile Payment Form Sheet - Bottom Drawer */}
      <Sheet
        open={showCustomerForm}
        onOpenChange={(open) => {
          setShowCustomerForm(open);
          if (!open) {
            // Reset form when closing
            setCustomerPhone("");
            setMobileDeliveryAddress("");
          }
        }}
      >
        <SheetContent
          side="bottom"
          className="h-auto max-h-[60vh] flex flex-col p-0 w-96 right-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowCustomerForm(false);
                  setCustomerPhone("");
                  setMobileDeliveryAddress("");
                }}
                className="p-2 hover:bg-accent rounded-md touch-manipulation"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <SheetTitle className="text-left">Customer Details</SheetTitle>
                <SheetDescription className="text-left">
                  {orderType === "delivery"
                    ? "Enter customer phone number and delivery address"
                    : "Enter customer phone number"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
            {/* Mobile Number */}
            <div>
              <label
                htmlFor="mobile-phone"
                className="text-sm font-medium block mb-2"
              >
                Mobile Number <span className="text-destructive">*</span>
              </label>
              <Input
                id="mobile-phone"
                type="tel"
                value={customerPhone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomerPhone(e.target.value)
                }
                placeholder="+233 24 000 0000"
                className="h-12 text-base"
                required
              />
              {customerPhone &&
                !/^(\+233|233|0)[2356]\d{8}$/.test(
                  customerPhone.replace(/\s+/g, "")
                ) && (
                  <p className="text-xs text-destructive mt-1">
                    Please enter a valid Ghanaian phone number
                  </p>
                )}
            </div>

            {/* Delivery Address - Only for delivery orders */}
            {orderType === "delivery" && (
              <div>
                <label
                  htmlFor="mobile-address"
                  className="text-sm font-medium block mb-2"
                >
                  Delivery Address <span className="text-destructive">*</span>
                </label>
                <LocationAutocomplete
                  value={mobileDeliveryAddress}
                  onChange={setMobileDeliveryAddress}
                  placeholder="Start typing your address..."
                  className="w-full"
                  required
                />
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="border-t px-6 py-4 bg-background">
            <Button
              className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-medium"
              onClick={handleFinalizeMobilePayment}
              disabled={!canFinalizeMobilePayment}
            >
              Send Payment Link
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
