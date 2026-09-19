import { NextResponse, type NextRequest } from "next/server";
import { resolveAuthenticatedTenant } from "@/lib/server-auth";
import { ServerNotificationService } from "@/services/server-notification.service";

export async function GET(request: NextRequest) {
  try {
    const authSession = await resolveAuthenticatedTenant(request);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const tab = (searchParams.get("tab") as any) || "all";
    const isReadParam = searchParams.get("isRead");
    const isRead = isReadParam !== null ? isReadParam === "true" : undefined;

    const result = await ServerNotificationService.getNotifications(authSession.tenantId, {
      page,
      limit,
      tab,
      isRead,
    });

    return NextResponse.json({
      success: true,
      notifications: result.notifications,
      unreadCount: result.unreadCount,
      total: result.total,
      tenantId: authSession.tenantId,
    });
  } catch (err: any) {
    console.warn("[NotificationAPI] GET /api/notifications error:", err?.message);
    return NextResponse.json(
      { error: "Failed to fetch notifications.", details: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authSession = await resolveAuthenticatedTenant(request);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      type = "action_created",
      title,
      message,
      actionUrl,
      entityType,
      entityId,
      metadata,
      dedupKey,
      sendPush = true,
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required fields." },
        { status: 400 }
      );
    }

    const notification = await ServerNotificationService.createNotification({
      tenantId: authSession.tenantId,
      userId: authSession.userId,
      type,
      title,
      message,
      actionUrl,
      entityType,
      entityId,
      metadata,
      dedupKey,
      sendPush,
    });

    return NextResponse.json({
      success: !!notification,
      notification,
    });
  } catch (err: any) {
    console.warn("[NotificationAPI] POST /api/notifications error:", err?.message);
    return NextResponse.json(
      { error: "Failed to create notification.", details: err?.message },
      { status: 500 }
    );
  }
}
