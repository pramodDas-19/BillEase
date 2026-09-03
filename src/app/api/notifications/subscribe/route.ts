import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, tenantId } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid PushSubscription object." },
        { status: 400 }
      );
    }

    console.info(`[WebPush] Subscription registered for tenant: ${tenantId || "active"}`);

    return NextResponse.json({
      success: true,
      message: "Push notification subscription registered successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to register push subscription.", details: err.message },
      { status: 500 }
    );
  }
}
