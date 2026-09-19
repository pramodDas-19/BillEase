import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthenticatedTenant } from "@/lib/server-auth";
import { ServerNotificationService } from "@/services/server-notification.service";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authSession = await resolveAuthenticatedTenant(request);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Notification ID required." }, { status: 400 });
    }

    const success = await ServerNotificationService.dismissNotification(authSession.tenantId, id);

    return NextResponse.json({
      success,
      id,
    });
  } catch (err: any) {
    console.warn("[NotificationAPI] DELETE notification error:", err?.message);
    return NextResponse.json(
      { error: "Failed to delete notification." },
      { status: 500 }
    );
  }
}
