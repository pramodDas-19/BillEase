import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthenticatedTenant } from "@/lib/server-auth";
import { ServerNotificationService } from "@/services/server-notification.service";

export async function GET(request: NextRequest) {
  try {
    const authSession = await resolveAuthenticatedTenant(request);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const count = await ServerNotificationService.getUnreadCount(authSession.tenantId);

    return NextResponse.json({
      success: true,
      unreadCount: count,
    });
  } catch (err: any) {
    console.warn("[NotificationAPI] GET unread-count error:", err?.message);
    return NextResponse.json(
      { error: "Failed to get unread count." },
      { status: 500 }
    );
  }
}
