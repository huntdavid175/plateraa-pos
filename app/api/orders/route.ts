import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `ORD-${timestamp}-${random}`;
}

// Find or create customer
async function findOrCreateCustomer(
  name: string,
  phone: string,
  email?: string,
  address?: string
): Promise<string | null> {
  try {
    // First, try to find existing customer by phone
    const { data: existingCustomer, error: findError } = await supabase
      .from("customers")
      .select("id")
      .eq("phone", phone)
      .single();

    if (existingCustomer && !findError) {
      // Update customer info if provided
      if (name || email || address) {
        await supabase
          .from("customers")
          .update({
            name: name || undefined,
            email: email || undefined,
            address: address || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCustomer.id);
      }
      return existingCustomer.id;
    }

    // Create new customer
    const { data: newCustomer, error: createError } = await supabase
      .from("customers")
      .insert({
        name,
        phone,
        email: email || null,
        address: address || null,
      })
      .select("id")
      .single();

    if (createError || !newCustomer) {
      console.error("Error creating customer:", createError);
      return null;
    }

    return newCustomer.id;
  } catch (error) {
    console.error("Unexpected error in findOrCreateCustomer:", error);
    return null;
  }
}

// Get or create branch for institution
async function getOrCreateBranch(
  institutionId: string
): Promise<string | null> {
  try {
    // Try to get the first branch for this institution
    const { data: branches, error } = await supabase
      .from("branches")
      .select("id")
      .eq("institution_id", institutionId)
      .limit(1);

    if (error) {
      console.error("Error fetching branch:", error);
      return null;
    }

    if (branches && branches.length > 0) {
      return branches[0].id;
    }

    // If no branch exists, we can't create an order
    // In production, you might want to create a default branch
    return null;
  } catch (error) {
    console.error("Unexpected error in getOrCreateBranch:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      institution_id,
      branch_id, // Optional - will be fetched if not provided
      order_type,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      delivery_address,
      items,
      subtotal,
      delivery_fee,
      total,
      payment_method,
      notes,
      channel = "pos", // Default to 'pos' for POS orders
    } = body;

    // Validate required fields
    if (!institution_id) {
      return NextResponse.json(
        { error: "Institution ID is required" },
        { status: 400 }
      );
    }

    if (!customer_name) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    // Phone number is only required for non-cash payments
    // For cash payments, we can use a placeholder if not provided
    const finalCustomerPhone = customer_phone || (payment_method === "cash" ? "N/A" : null);
    
    if (!finalCustomerPhone && payment_method !== "cash") {
      return NextResponse.json(
        { error: "Customer phone is required for non-cash payments" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // Get branch_id if not provided
    let finalBranchId = branch_id;
    if (!finalBranchId) {
      finalBranchId = await getOrCreateBranch(institution_id);
      if (!finalBranchId) {
        return NextResponse.json(
          { error: "No branch found for institution. Please provide branch_id." },
          { status: 400 }
        );
      }
    }

    // Validate order_type mapping (UI uses "dine-in", "takeaway", "delivery")
    // Database uses "dine_in", "pickup", "delivery"
    const dbOrderType =
      order_type === "dine-in"
        ? "dine_in"
        : order_type === "takeaway"
        ? "pickup"
        : order_type === "delivery"
        ? "delivery"
        : "pickup";

    // Customer is auto-linked by trigger based on customer_phone
    // We don't need to manually set customer_id

    // Generate unique order number
    let orderNumber = generateOrderNumber();
    let attempts = 0;
    const maxAttempts = 5;

    // Ensure order number is unique
    while (attempts < maxAttempts) {
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("order_number", orderNumber)
        .single();

      if (!existing) {
        break; // Order number is unique
      }

      orderNumber = generateOrderNumber();
      attempts++;
    }

    // Determine payment_status based on payment method
    // Cash payments are marked as 'paid', others start as 'pending'
    // Order status is always 'pending' initially (will be updated in kitchen)
    const paymentStatus = payment_method === "cash" ? "paid" : "pending";

    // Calculate delivery_fee if not provided (0 for pickup/dine-in)
    const finalDeliveryFee =
      delivery_fee !== undefined
        ? delivery_fee
        : dbOrderType === "delivery"
        ? 0 // You might want to calculate this based on distance
        : 0;

    // Create order - matching the actual database schema
    const orderData: any = {
      order_number: orderNumber,
      institution_id: institution_id,
      branch_id: finalBranchId,
      customer_name: customer_name,
      customer_phone: finalCustomerPhone, // Use placeholder for cash if not provided
      delivery_type: dbOrderType,
      channel: channel,
      subtotal: subtotal,
      delivery_fee: finalDeliveryFee,
      total_amount: total,
      status: "pending", // Always start as 'pending' (will be updated in kitchen workflow)
      payment_method: payment_method || null,
      payment_status: paymentStatus, // Mark as 'paid' for cash payments, 'pending' for others
      notes: notes || null,
    };

    // Add optional fields
    if (customer_email) {
      orderData.customer_email = customer_email;
    }
    if (delivery_address) {
      orderData.delivery_address = delivery_address;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(orderData)
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Error creating order:", orderError);
      return NextResponse.json(
        { error: "Failed to create order", details: orderError?.message },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = [];
    for (const item of items) {
      // Get variant name from selected_variations if present
      let variantName: string | null = null;
      if (item.selected_variations && item.selected_variations.length > 0) {
        // Get the first variation option name
        variantName = item.selected_variations[0].option_name || null;
      }

      const { data: orderItem, error: itemError } = await supabase
        .from("order_items")
        .insert({
          order_id: order.id,
          menu_item_id: item.menu_item_id,
          item_name: item.menu_item?.name || "Item",
          unit_price: item.price,
          quantity: item.quantity,
          total_price: item.subtotal,
          variant_name: variantName,
          notes: item.special_instructions || null,
        })
        .select("id")
        .single();

      if (itemError || !orderItem) {
        console.error("Error creating order item:", itemError);
        // Continue with other items even if one fails
        continue;
      }

      // Create order item addons if present
      if (item.selected_add_ons && item.selected_add_ons.length > 0) {
        const addons = item.selected_add_ons.map((addon: any) => ({
          order_item_id: orderItem.id,
          addon_name: addon.name,
          addon_price: addon.price,
          quantity: addon.quantity || 1, // Default to 1 if not specified
        }));

        const { error: addonError } = await supabase
          .from("order_item_addons")
          .insert(addons);

        if (addonError) {
          console.error("Error creating order item addons:", addonError);
          // Continue even if addons fail
        }
      }

      orderItems.push(orderItem);
    }

    // Verify at least one order item was created
    if (orderItems.length === 0) {
      // Rollback: delete the order if no items were created
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 }
      );
    }

    // Create initial order timeline entry
    const { error: timelineError } = await supabase
      .from("order_timeline")
      .insert({
        order_id: order.id,
        event_type: "pending",
        event_description:
          paymentStatus === "paid"
            ? `Order created from POS (Payment received via ${payment_method || "cash"})`
            : "Order created from POS",
      });

    if (timelineError) {
      // Log but don't fail the order creation if timeline fails
      console.error("Error creating order timeline entry:", timelineError);
    }

    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          order_number: orderNumber,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error in order creation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
