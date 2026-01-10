"use client";

import { Customer, OrderType } from "@/types";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";

interface CustomerInfoFormProps {
  orderType: OrderType;
  customer?: Customer;
  tableNumber?: string;
  deliveryAddress?: string;
  phoneOnly?: boolean; // If true, only show phone input (for payment links)
  onCustomerChange: (customer: Customer | null) => void;
  onTableNumberChange: (tableNumber: string) => void;
  onDeliveryAddressChange: (address: string) => void;
  onPhoneChange?: (phone: string) => void; // For phone-only mode
}

// Ghanaian phone number validation
const validatePhone = (phone: string): boolean => {
  // Accepts formats: +233..., 233..., 0...
  // Ghanaian mobile numbers start with 2, 3, 5, or 6
  const cleaned = phone.replace(/\s+/g, "");
  const patterns = [
    /^\+233[2356]\d{8}$/, // +233 format (9 digits after country code)
    /^233[2356]\d{8}$/, // 233 format (9 digits after country code)
    /^0[2356]\d{8}$/, // 0 format (10 digits total)
  ];
  return patterns.some((pattern) => pattern.test(cleaned));
};

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("0")) {
    return `+233${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith("233")) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("+233")) {
    return cleaned;
  }
  return cleaned;
};

export function CustomerInfoForm({
  orderType,
  customer,
  tableNumber,
  deliveryAddress,
  phoneOnly = false,
  onCustomerChange,
  onTableNumberChange,
  onDeliveryAddressChange,
  onPhoneChange,
}: CustomerInfoFormProps) {
  const [name, setName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [email, setEmail] = useState(customer?.email || "");
  
  // Update phone when customer changes (for phone-only mode)
  useEffect(() => {
    if (customer?.phone) {
      setPhone(customer.phone);
    }
  }, [customer]);
  const [suggestions, setSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  // Helper function to get customers from localStorage
  const getCustomersFromStorage = (): Customer[] => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pos_customers");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  };

  // Search for existing customers
  useEffect(() => {
    const searchCustomers = () => {
      if (phone.length >= 3) {
        const allCustomers = getCustomersFromStorage();
        const filtered = allCustomers.filter((c) =>
          c.phone.toLowerCase().includes(phone.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 5));
        setShowSuggestions(filtered.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounceTimer);
  }, [phone]);

  // Validate phone number
  useEffect(() => {
    if (phone && phone.length > 0) {
      if (!validatePhone(phone)) {
        setPhoneError("Invalid phone number format");
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  }, [phone]);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    // In phone-only mode, notify parent immediately
    if (phoneOnly && onPhoneChange) {
      onPhoneChange(value);
    }
    // Clear customer if phone changes
    if (customer) {
      onCustomerChange(null);
    }
  };

  const handleSelectCustomer = (selectedCustomer: Customer) => {
    setName(selectedCustomer.name);
    setPhone(selectedCustomer.phone);
    setEmail(selectedCustomer.email || "");
    onCustomerChange(selectedCustomer);
    setShowSuggestions(false);
  };

  const handleCreateOrUpdateCustomer = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Validation Error: Name and phone number are required");
      return;
    }

    if (phoneError) {
      toast.error(`Invalid Phone Number: ${phoneError}`);
      return;
    }

    const formattedPhone = formatPhone(phone);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (customer) {
      // Update existing customer
      const updatedCustomer: Customer = {
        ...customer,
        name: name.trim(),
        phone: formattedPhone,
        email: email.trim() || undefined,
        updated_at: new Date().toISOString(),
      };

      // Update in localStorage
      const allCustomers = getCustomersFromStorage().map((c) =>
        c.id === customer.id ? updatedCustomer : c
      );
      if (typeof window !== "undefined") {
        localStorage.setItem("pos_customers", JSON.stringify(allCustomers));
      }

      onCustomerChange(updatedCustomer);
      toast.success("Customer Updated: Customer information has been updated");
    } else {
      // Create new customer
      const newCustomer: Customer = {
        id: `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: name.trim(),
        phone: formattedPhone,
        email: email.trim() || undefined,
        created_at: new Date().toISOString(),
      };

      // Save to localStorage
      const allCustomers = [...getCustomersFromStorage(), newCustomer];
      if (typeof window !== "undefined") {
        localStorage.setItem("pos_customers", JSON.stringify(allCustomers));
      }

      onCustomerChange(newCustomer);
      toast.success("Customer Created: New customer has been added");
    }
  };

  // Phone-only mode (for payment links)
  if (phoneOnly) {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="customer-phone" className="text-sm font-medium">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <div className="relative mt-1">
            <Input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="+233 24 000 0000"
              className={cn(
                "h-11",
                phoneError && "border-destructive focus-visible:ring-destructive"
              )}
              required
              aria-required="true"
              aria-invalid={!!phoneError}
              aria-describedby={phoneError ? "phone-error" : undefined}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelectCustomer(suggestion)}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors touch-manipulation"
                  >
                    <div className="font-medium">{suggestion.name || suggestion.phone}</div>
                    {suggestion.name && (
                      <div className="text-xs text-muted-foreground">
                        {suggestion.phone}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {phoneError && (
            <p id="phone-error" className="text-xs text-destructive mt-1">
              {phoneError}
            </p>
          )}
          {!phoneError && phone && validatePhone(phone) && (
            <p className="text-xs text-muted-foreground mt-1">
              Payment link will be sent to {formatPhone(phone)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Full customer form mode (for placing orders)
  return (
    <div className="space-y-4">
      {/* Customer Name */}
      <div>
        <Label htmlFor="customer-name" className="text-sm font-medium">
          Customer Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="customer-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter customer name"
          className="mt-1 h-11"
          required
          aria-required="true"
        />
      </div>

      {/* Phone Number */}
      <div>
        <Label htmlFor="customer-phone" className="text-sm font-medium">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <div className="relative mt-1">
          <Input
            id="customer-phone"
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="+233 24 000 0000"
            className={cn(
              "h-11",
              phoneError && "border-destructive focus-visible:ring-destructive"
            )}
            required
            aria-required="true"
            aria-invalid={!!phoneError}
            aria-describedby={phoneError ? "phone-error" : undefined}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectCustomer(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-accent transition-colors touch-manipulation"
                >
                  <div className="font-medium">{suggestion.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {suggestion.phone}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {phoneError && (
          <p id="phone-error" className="text-xs text-destructive mt-1">
            {phoneError}
          </p>
        )}
      </div>

      {/* Email (Optional) */}
      <div>
        <Label htmlFor="customer-email" className="text-sm font-medium">
          Email (Optional)
        </Label>
        <Input
          id="customer-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer@example.com"
          className="mt-1 h-11"
        />
      </div>

      {/* Table Number (Dine-in only) */}
      {orderType === "dine-in" && (
        <div>
          <Label htmlFor="table-number" className="text-sm font-medium">
            Table Number
          </Label>
          <Input
            id="table-number"
            type="text"
            value={tableNumber || ""}
            onChange={(e) => onTableNumberChange(e.target.value)}
            placeholder="e.g., 02, 05, 12"
            className="mt-1 h-11"
          />
        </div>
      )}

      {/* Delivery Address (Delivery only) */}
      {orderType === "delivery" && (
        <div>
          <Label htmlFor="delivery-address" className="text-sm font-medium">
            Delivery Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="delivery-address"
            type="text"
            value={deliveryAddress || ""}
            onChange={(e) => onDeliveryAddressChange(e.target.value)}
            placeholder="Enter delivery address"
            className="mt-1 h-11"
            required={orderType === "delivery"}
            aria-required={orderType === "delivery"}
          />
        </div>
      )}

      {/* Save Customer Button */}
      <button
        onClick={handleCreateOrUpdateCustomer}
        className="w-full h-11 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors touch-manipulation"
        aria-label="Save customer information"
      >
        {customer ? "Update Customer" : "Save Customer"}
      </button>
    </div>
  );
}

function Label({
  htmlFor,
  className,
  children,
}: {
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={className}>
      {children}
    </label>
  );
}


