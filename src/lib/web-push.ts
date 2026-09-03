import webPush from "web-push";

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BJXGGIrJaagO3mfuRXEiP9IKUevMAhsjd7rKDz973lMNeMQGN2HbCfWJjnURWvTIcz7XjHHDeOdAGzv3G-VmI98";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "tsFjHlPyA4Zqt7kMD7aR7HJe6zozhHiXLbTiXPMqevE";

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:support@billease.app";

// Initialize VAPID details on the server
if (typeof window === "undefined") {
  try {
    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  } catch (err) {
    console.warn("Failed to set VAPID details:", err);
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Dispatches a real background push notification to a subscribed client browser/device.
 */
export async function sendWebPushNotification(
  subscription: webPush.PushSubscription,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    const stringPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/dashboard",
    });

    await webPush.sendNotification(subscription, stringPayload);
    return true;
  } catch (err: any) {
    console.warn("Error sending web push notification:", err.message);
    return false;
  }
}

/**
 * Helper to convert Base64 URL to Uint8Array for browser pushManager.subscribe()
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
