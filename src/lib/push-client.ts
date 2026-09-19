// ============================================================================
// BILLEASE SAAS — CLIENT-SIDE WEB PUSH HELPER
// Browser-only module. Never imports Node.js web-push.
// ============================================================================

export const NEXT_PUBLIC_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BJXGGIrJaagO3mfuRXEiP9IKUevMAhsjd7rKDz973lMNeMQGN2HbCfWJjnURWvTIcz7XjHHDeOdAGzv3G-VmI98";

/**
 * Converts Base64 URL to Uint8Array for browser pushManager.subscribe()
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks whether Web Push & Service Worker are supported in the current environment
 */
export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Ensures Service Worker is registered once
 */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    console.warn("[PushClient] Service worker registration failed:", err);
    return null;
  }
}

/**
 * Registers browser push subscription with backend API
 */
export async function registerPushSubscription(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: "Web push is not supported on this browser." };
  }

  try {
    const reg = await ensureServiceWorker();
    if (!reg) return { success: false, error: "Service Worker not ready." };

    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      const convertedVapidKey = urlBase64ToUint8Array(NEXT_PUBLIC_VAPID_PUBLIC_KEY);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    // Send subscription payload securely to backend
    const rawSub = sub.toJSON();
    if (!rawSub.endpoint || !rawSub.keys?.p256dh || !rawSub.keys?.auth) {
      return { success: false, error: "Push subscription payload incomplete." };
    }

    const res = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: {
          endpoint: rawSub.endpoint,
          keys: {
            p256dh: rawSub.keys.p256dh,
            auth: rawSub.keys.auth,
          },
        },
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || "Subscription registration failed." };
    }

    return { success: true };
  } catch (err: any) {
    console.warn("[PushClient] Failed to register push subscription:", err);
    return { success: false, error: err?.message || "Unknown error" };
  }
}

/**
 * Requests native browser notification permission and subscribes to push if granted.
 */
export async function requestPermissionAndSubscribe(): Promise<{
  granted: boolean;
  status: "granted" | "denied" | "default" | "unsupported";
}> {
  if (!isPushSupported()) {
    return { granted: false, status: "unsupported" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await registerPushSubscription();
      return { granted: true, status: "granted" };
    }
    return { granted: false, status: permission };
  } catch (err) {
    console.warn("[PushClient] Permission request error:", err);
    return { granted: false, status: "denied" };
  }
}
