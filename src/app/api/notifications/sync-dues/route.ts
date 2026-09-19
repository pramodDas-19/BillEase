import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthenticatedTenant } from "@/lib/server-auth";
import { ServerNotificationService } from "@/services/server-notification.service";

export async function POST(request: NextRequest) {
  try {
    const authSession = await resolveAuthenticatedTenant(request);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const { createdCount } = await ServerNotificationService.syncDueNotifications(
      authSession.tenantId
    );

    return NextResponse.json({
      success: true,
      synced: createdCount,
    });
  } catch (err: any) {
    console.warn("[NotificationAPI] POST sync-dues error:", err?.message);
    return NextResponse.json(
      { error: "Failed to sync due notifications.", details: err?.message },
      { status: 500 }
    );
  }
}
