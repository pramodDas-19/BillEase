import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthenticatedTenant } from "@/lib/server-auth";
import { ServerNotificationService } from "@/services/server-notification.service";

export async function POST(request: NextRequest) {
  try {
    const authSession = await resolveAuthenticatedTenant(request);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const success = await ServerNotificationService.clearAllNotifications(authSession.tenantId);

    return NextResponse.json({
      success,
      message: "All notifications cleared.",
    });
  } catch (err: any) {
    console.warn("[NotificationAPI] POST clear-all error:", err?.message);
    return NextResponse.json(
      { error: "Failed to clear all notifications." },
      { status: 500 }
    );
  }
}
