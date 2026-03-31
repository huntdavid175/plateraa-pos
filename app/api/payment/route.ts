import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const DEFAULT_REUSABLE = "0";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      amount,
      externalRef,
      email,
      callback,
      redirect,
      metadata,
    } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    if (!externalRef) {
      return NextResponse.json(
        { error: "External reference is required" },
        { status: 400 }
      );
    }

    // Get Moolre credentials from environment variables
    const username = process.env.MOOLRE_USERNAME;
    const publicKey = process.env.NEXT_PUBLIC_MOOLRE_PUBLIC_KEY;
    const accountNumber = process.env.MOOLRE_ACCOUNT_NUMBER;

    if (!username || !publicKey || !accountNumber) {
      console.error("Missing Moolre credentials in environment variables");
      return NextResponse.json(
        { error: "Payment service configuration error" },
        { status: 500 }
      );
    }

    const callbackUrl =
      callback || process.env.MOOLRE_CALLBACK_URL || req.nextUrl.origin;
    const redirectUrl =
      redirect || process.env.MOOLRE_REDIRECT_URL || req.nextUrl.origin;

    // Prepare payment request
    const paymentData = {
      type: 1,
      amount: amount.toString(),
      email: email || "",
      externalref: externalRef,
      callback: callbackUrl,
      redirect: redirectUrl,
      reusable: DEFAULT_REUSABLE,
      currency: "GHS",
      accountnumber: accountNumber,
      metadata: metadata || {},
    };

    // Call Moolre API
    const response = await fetch("https://api.moolre.com/embed/link", {
      method: "POST",
      headers: {
        "X-API-USER": username,
        "X-API-PUBKEY": publicKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Moolre API error:", responseData);
      return NextResponse.json(
        {
          error: "Payment initiation failed",
          details: responseData.message || "Unknown error",
        },
        { status: response.status || 500 }
      );
    }

    console.log("[Payment API] Moolre embed/link response:", responseData);

    const paymentLink =
      responseData?.data?.authorization_url ||
      responseData?.data?.link ||
      responseData?.link ||
      responseData?.data?.url ||
      responseData?.url ||
      null;

    if (!paymentLink) {
      console.warn(
        "[Payment API] No payment link found in response. Known fields checked: data.authorization_url, data.link, link, data.url, url"
      );
    } else {
      console.log("[Payment API] Extracted payment link:", paymentLink);
    }

    // Best-effort: persist generated link on the order when externalRef is order id.
    if (paymentLink) {
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          payment_link: paymentLink,
          updated_at: new Date().toISOString(),
        })
        .eq("id", externalRef);

      if (orderUpdateError) {
        console.error("Failed to save payment link on order:", orderUpdateError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        paymentLink,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
