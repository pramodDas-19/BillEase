// ============================================================================
// BillEase SaaS — Web Push & PWA Service Worker
// Production-Ready: Robust Push Handling & Tab Navigation
// ============================================================================

const CACHE_NAME = "billease-cache-v2";
const STATIC_ASSETS = ["/dashboard", "/invoices", "/quotations", "/clients", "/icon.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Don't cache API notification endpoints
  if (event.request.url.includes("/api/notifications")) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// ============================================================================
// PUSH EVENT LISTENER: Robust Handling with Malformed Payload Protection
// ============================================================================
self.addEventListener("push", (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      try {
        data = { body: event.data.text() };
      } catch {
        data = {};
      }
    }
  }

  const title = typeof data.title === "string" && data.title.trim() ? data.title.trim() : "BillEase Alert";
  const body = typeof data.body === "string" && data.body.trim() ? data.body.trim() : "New billing activity in your account.";
  
  // Safe relative or same-origin URL resolution
  let rawUrl = typeof data.url === "string" ? data.url : "/dashboard";
  if (!rawUrl.startsWith("/") && !rawUrl.startsWith(self.origin)) {
    rawUrl = "/dashboard";
  }

  const options = {
    body,
    icon: data.icon || "/icon.png",
    badge: data.badge || "/icon.png",
    vibrate: [100, 50, 100],
    data: {
      url: rawUrl,
      type: data.type || "system",
      entityType: data.entityType,
      entityId: data.entityId,
      timestamp: Date.now(),
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch((err) => {
      console.warn("[SW] showNotification error:", err);
    })
  );
});

// ============================================================================
// NOTIFICATION CLICK: Focus AND Navigate Existing Tabs to Target URL
// ============================================================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  let targetUrl = event.notification.data?.url || "/dashboard";

  // Validate URL to prevent security issues / open redirects
  try {
    const parsed = new URL(targetUrl, self.origin);
    // Ensure URL belongs to self origin
    if (parsed.origin !== self.origin) {
      targetUrl = "/dashboard";
    } else {
      targetUrl = parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {
    targetUrl = "/dashboard";
  }

  const fullTargetUrl = new URL(targetUrl, self.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      // 1. Look for an existing BillEase window/tab
      for (const client of clientList) {
        if (client.url && client.url.includes(self.origin)) {
          // If the tab is already on the exact URL, just focus it
          if (client.url === fullTargetUrl && "focus" in client) {
            return client.focus();
          }

          // Otherwise, navigate the existing tab to the target URL, then focus
          if ("navigate" in client && typeof client.navigate === "function") {
            try {
              const navigatedClient = await client.navigate(fullTargetUrl);
              if (navigatedClient && "focus" in navigatedClient) {
                return navigatedClient.focus();
              }
            } catch (navErr) {
              console.warn("[SW] client.navigate failed, falling back to focus:", navErr);
            }
          }

          if ("focus" in client) {
            return client.focus();
          }
        }
      }

      // 2. If no matching open BillEase tab was found, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullTargetUrl);
      }
    })
  );
});
