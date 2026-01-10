"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderType } from "@/types";
import { CreditCard, Smartphone, Banknote, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { CustomerInfoForm } from "./CustomerInfoForm";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  orderType: OrderType;
  onPlaceOrder: (paymentMethod: "cash" | "card" | "mobile_money") => Promise<void>;
  onSendPaymentLink: (phoneNumber?: string) => Promise<void>;
}

export function PaymentDialog({
  open,
  onOpenChange,
  total,
  orderType,
  onPlaceOrder,
  onSendPaymentLink,
}: PaymentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<
    "cash" | "card" | "mobile_money" | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentLinkSent, setPaymentLinkSent] = useState(false);
  const [customerPhone, setCustomerPhone] = useState<string>("");

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error("Select Payment Method: Please select a payment method");
      return;
    }

    // Validate phone number for payment links
    if (selectedMethod === "card" || selectedMethod === "mobile_money") {
      if (!customerPhone.trim()) {
        toast.error("Phone Number Required: Please enter customer phone number to send payment link");
        return;
      }
      
      // Basic phone validation
      const cleaned = customerPhone.replace(/\s+/g, "");
      const isValid = /^(\+233|233|0)[2356]\d{8}$/.test(cleaned);
      if (!isValid) {
        toast.error("Invalid Phone Number: Please enter a valid Ghanaian phone number");
        return;
      }
    }

    setIsProcessing(true);

    try {
      if (selectedMethod === "card" || selectedMethod === "mobile_money") {
        // Send payment link with phone number
        await onSendPaymentLink(customerPhone);
        setPaymentLinkSent(true);
      } else {
        // Cash payment - mark as paid and place order
        await onPlaceOrder("cash");
        toast.success("Order Placed: Order has been placed and marked as paid");
        onOpenChange(false);
        resetDialog();
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(`Payment Error: ${error.message || "Failed to process payment"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setSelectedMethod(null);
    setPaymentLinkSent(false);
    setIsProcessing(false);
    setCustomerPhone("");
  };

  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
      resetDialog();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Payment Method</DialogTitle>
          <DialogDescription>
            Choose how the customer will pay for this order
          </DialogDescription>
        </DialogHeader>

        {paymentLinkSent ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Payment Link Sent!
              </h3>
              <p className="text-sm text-muted-foreground">
                The payment link has been sent to the customer. You can close
                this dialog and continue with other orders.
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3 py-4">
              {/* Card Payment */}
              <button
                onClick={() => setSelectedMethod("card")}
                className={`w-full p-4 rounded-lg border-2 transition-all touch-manipulation ${
                  selectedMethod === "card"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                aria-pressed={selectedMethod === "card"}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Card Payment</div>
                    <div className="text-xs text-muted-foreground">
                      Send payment link for card payment
                    </div>
                  </div>
                  {selectedMethod === "card" && (
                    <div className="h-4 w-4 rounded-full bg-primary" />
                  )}
                </div>
              </button>

              {/* Mobile Money */}
              <button
                onClick={() => setSelectedMethod("mobile_money")}
                className={`w-full p-4 rounded-lg border-2 transition-all touch-manipulation ${
                  selectedMethod === "mobile_money"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                aria-pressed={selectedMethod === "mobile_money"}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Mobile Money</div>
                    <div className="text-xs text-muted-foreground">
                      Send payment link for mobile money
                    </div>
                  </div>
                  {selectedMethod === "mobile_money" && (
                    <div className="h-4 w-4 rounded-full bg-primary" />
                  )}
                </div>
              </button>

              {/* Cash Payment */}
              <button
                onClick={() => setSelectedMethod("cash")}
                className={`w-full p-4 rounded-lg border-2 transition-all touch-manipulation ${
                  selectedMethod === "cash"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                aria-pressed={selectedMethod === "cash"}
              >
                <div className="flex items-center gap-3">
                  <Banknote className="h-5 w-5" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">Cash Payment</div>
                    <div className="text-xs text-muted-foreground">
                      Mark as paid and send to kitchen
                    </div>
                  </div>
                  {selectedMethod === "cash" && (
                    <div className="h-4 w-4 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            </div>

            {/* Phone Input for Payment Links */}
            {(selectedMethod === "card" || selectedMethod === "mobile_money") && (
              <div className="py-4 border-t">
                <h4 className="text-sm font-medium mb-3">Customer Phone Number</h4>
                <CustomerInfoForm
                  orderType={orderType}
                  phoneOnly={true}
                  onPhoneChange={setCustomerPhone}
                  onCustomerChange={() => {}}
                  onTableNumberChange={() => {}}
                  onDeliveryAddressChange={() => {}}
                />
              </div>
            )}

            <div className="py-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-primary">
                  ₵{total.toLocaleString()}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                disabled={
                  !selectedMethod || 
                  isProcessing ||
                  ((selectedMethod === "card" || selectedMethod === "mobile_money") && !customerPhone.trim())
                }
                className="bg-primary hover:bg-primary/90"
              >
                {isProcessing ? (
                  "Processing..."
                ) : selectedMethod === "card" ||
                  selectedMethod === "mobile_money" ? (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Payment Link
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Place Order
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

