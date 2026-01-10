export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  display_order: number;
  created_at: string;
}

export interface VariationOption {
  id: string;
  name: string;
  price_modifier: number; // Additional price (can be negative for discounts)
}

export interface Variation {
  id: string;
  name: string; // e.g., "Size", "Spice Level"
  required: boolean;
  options: VariationOption[];
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category_id: string;
  is_available: boolean;
  is_featured: boolean;
  preparation_time?: number; // in minutes
  variations?: Variation[]; // Optional variations (e.g., size, spice level)
  add_ons?: AddOn[]; // Optional add-ons (e.g., extra cheese, toppings)
  created_at: string;
  updated_at: string;
}

export interface SelectedVariation {
  variation_id: string;
  variation_name: string;
  option_id: string;
  option_name: string;
  price_modifier: number;
}

export interface SelectedAddOn {
  add_on_id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  menu_item_id: string;
  menu_item: MenuItem;
  quantity: number;
  price: number;
  selected_variations?: SelectedVariation[];
  selected_add_ons?: SelectedAddOn[];
  special_instructions?: string;
  subtotal: number;
}

export type OrderType = "dine-in" | "takeaway" | "delivery";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  order_type: OrderType;
  customer_id?: string;
  customer?: Customer;
  table_number?: string;
  delivery_address?: string;
  items: OrderItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled";
  payment_method?: "cash" | "card" | "mobile_money";
  payment_status: "pending" | "paid" | "refunded";
  payment_link?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentLinkResponse {
  link: string;
  qr_code?: string;
  expires_at: string;
}

