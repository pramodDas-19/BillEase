import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthenticatedTenant } from "@/lib/server-auth";
import { ServerNotificationService } from "@/services/server-notification.service";

export async function POST(request: NextRequest) {
  try {
    const authSession = await resolveAuthenticatedTenant(request);
    if (!authSession) {
      return NextResponse.json({ error: "Failed to resolve session." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { subscription } = body;

    if (
      !subscription ||
      !subscription.endpoint ||
      !subscription.keys?.p256dh ||
      !subscription.keys?.auth
    ) {
      return NextResponse.json(
        { error: "Invalid PushSubscription object. Endpoint and keys required." },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || undefined;

    const success = await ServerNotificationService.registerPushSubscription({
      tenantId: authSession.tenantId,
      userId: authSession.userId,
      subscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      userAgent,
    });

    console.info(
      `[WebPush] Subscription registered for tenant: ${authSession.tenantId}, user: ${
        authSession.userId || "anonymous"
      }`
    );

    return NextResponse.json({
      success,
      message: "Push notification subscription registered successfully.",
      tenantId: authSession.tenantId,
    });
  } catch (err: any) {
    console.warn("[WebPush] Subscribe error:", err?.message);
    return NextResponse.json(
      { error: "Failed to register push subscription.", details: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authSession = await resolveAuthenticatedTenant(request);
    if (!authSession) {
      return NextResponse.json({ error: "Failed to resolve session." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint parameter required." }, { status: 400 });
    }

    const success = await ServerNotificationService.unregisterPushSubscription(
      authSession.tenantId,
      endpoint
    );

    return NextResponse.json({
      success,
      message: "Push subscription unsubscribed.",
    });
  } catch (err: any) {
    console.warn("[WebPush] Unsubscribe error:", err?.message);
    return NextResponse.json(
      { error: "Failed to unsubscribe push subscription." },
      { status: 500 }
    );
  }
}
