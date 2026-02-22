import { NextRequest, NextResponse } from "next/server";

type ServiceProvider = "MTN" | "Vodafone" | "Airtel";

const SERVICE_PROVIDER_CHANNELS: Record<ServiceProvider, string> = {
  MTN: "13",
  Vodafone: "6",
  Airtel: "7",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      phoneNumber,
      amount,
      serviceProvider,
      externalRef,
    } = body;

    // Validate required fields
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    if (!serviceProvider || !SERVICE_PROVIDER_CHANNELS[serviceProvider as ServiceProvider]) {
      return NextResponse.json(
        { error: "Valid service provider is required" },
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

    // Clean phone number (remove spaces, ensure it starts with country code)
    let cleanPhone = phoneNumber.replace(/\s+/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "233" + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith("+233")) {
      cleanPhone = cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith("233")) {
      cleanPhone = "233" + cleanPhone;
    }

    // Prepare payment request
    const paymentData = {
      type: 1,
      channel: SERVICE_PROVIDER_CHANNELS[serviceProvider as ServiceProvider],
      currency: "GHS",
      payer: cleanPhone,
      amount: amount.toString(),
      externalref: externalRef,
      accountnumber: accountNumber,
    };

    // Call Moolre API
    const response = await fetch("https://api.moolre.com/open/transact/payment", {
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

    return NextResponse.json(
      {
        success: true,
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
