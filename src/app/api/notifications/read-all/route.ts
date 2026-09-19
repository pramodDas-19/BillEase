import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthenticatedTenant } from "@/lib/server-auth";
import { ServerNotificationService } from "@/services/server-notification.service";

export async function POST(request: NextRequest) {
  try {
    const authSession = await resolveAuthenticatedTenant(request);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const success = await ServerNotificationService.markAllAsRead(authSession.tenantId);

    return NextResponse.json({
      success,
      message: "All notifications marked as read.",
    });
  } catch (err: any) {
    console.warn("[NotificationAPI] POST mark-all-read error:", err?.message);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read." },
      { status: 500 }
    );
  }
}
