import { Order, OrderItem, Customer, OrderType } from "@/types";

// Mock customers
const mockCustomers: Customer[] = [
  {
    id: "cust-1",
    name: "Kwame Mensah",
    phone: "+233 24 123 4567",
    email: "kwame@example.com",
    created_at: new Date().toISOString(),
  },
  {
    id: "cust-2",
    name: "Ama Asante",
    phone: "+233 24 987 6543",
    created_at: new Date().toISOString(),
  },
  {
    id: "cust-3",
    name: "Kofi Adjei",
    phone: "+233 24 555 1234",
    created_at: new Date().toISOString(),
  },
];

// Mock orders for kitchen view
export const mockKitchenOrders: Order[] = [
  {
    id: "order-1",
    order_number: "ORD-001",
    order_type: "dine-in",
    customer: mockCustomers[0],
    table_number: "05",
    items: [
      {
        id: "oi-1",
        menu_item_id: "item-1",
        menu_item: {
          id: "item-1",
          name: "Onigiri",
          description: "Japanese rice balls with various fillings",
          price: 12.9,
          category_id: "cat-1",
          is_available: true,
          is_featured: true,
          preparation_time: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        quantity: 2,
        price: 18.9,
        selected_variations: [
          {
            variation_id: "var-1",
            variation_name: "Size",
            option_id: "opt-3",
            option_name: "Large",
            price_modifier: 6.0,
          },
        ],
        subtotal: 37.8,
      },
      {
        id: "oi-2",
        menu_item_id: "item-7",
        menu_item: {
          id: "item-7",
          name: "Tom Yum Soup",
          description: "Spicy Thai soup with shrimp and mushrooms",
          price: 9.5,
          category_id: "cat-2",
          is_available: true,
          is_featured: true,
          preparation_time: 15,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        quantity: 1,
        price: 9.5,
        selected_variations: [
          {
            variation_id: "var-2",
            variation_name: "Spice Level",
            option_id: "opt-6",
            option_name: "Hot",
            price_modifier: 0,
          },
        ],
        subtotal: 9.5,
      },
    ],
    subtotal: 47.3,
    tax_rate: 0.1,
    tax_amount: 4.73,
    total: 52.03,
    status: "preparing",
    payment_method: "cash",
    payment_status: "paid",
    created_at: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
    updated_at: new Date(Date.now() - 2 * 60000).toISOString(), // 2 minutes ago
  },
  {
    id: "order-2",
    order_number: "ORD-002",
    order_type: "delivery",
    customer: mockCustomers[1],
    delivery_address: "45 East Legon, Accra",
    items: [
      {
        id: "oi-3",
        menu_item_id: "item-8",
        menu_item: {
          id: "item-8",
          name: "Iced Coffee",
          description: "Cold brewed coffee with ice",
          price: 4.0,
          category_id: "cat-3",
          is_available: true,
          is_featured: false,
          preparation_time: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        quantity: 2,
        price: 6.0,
        selected_variations: [
          {
            variation_id: "var-4",
            variation_name: "Size",
            option_id: "opt-12",
            option_name: "Large",
            price_modifier: 2.0,
          },
        ],
        selected_add_ons: [
          {
            add_on_id: "addon-6",
            name: "Extra Shot",
            price: 1.5,
          },
        ],
        subtotal: 19.0,
      },
    ],
    subtotal: 19.0,
    tax_rate: 0.1,
    tax_amount: 1.9,
    total: 20.9,
    status: "pending",
    payment_method: "mobile_money",
    payment_status: "paid",
    created_at: new Date(Date.now() - 2 * 60000).toISOString(), // 2 minutes ago
    updated_at: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: "order-3",
    order_number: "ORD-003",
    order_type: "takeaway",
    customer: mockCustomers[2],
    items: [
      {
        id: "oi-4",
        menu_item_id: "item-10",
        menu_item: {
          id: "item-10",
          name: "Dumplings",
          description: "Steamed pork dumplings",
          price: 11.5,
          category_id: "cat-1",
          is_available: true,
          is_featured: false,
          preparation_time: 18,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        quantity: 1,
        price: 23.0,
        selected_variations: [
          {
            variation_id: "var-5",
            variation_name: "Quantity",
            option_id: "opt-14",
            option_name: "12 pieces",
            price_modifier: 11.5,
          },
        ],
        subtotal: 23.0,
      },
    ],
    subtotal: 23.0,
    tax_rate: 0.1,
    tax_amount: 2.3,
    total: 25.3,
    status: "ready",
    payment_method: "cash",
    payment_status: "paid",
    created_at: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
    updated_at: new Date(Date.now() - 1 * 60000).toISOString(), // 1 minute ago
  },
];

