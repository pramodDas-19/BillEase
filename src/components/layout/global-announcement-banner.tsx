"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";

export function GlobalAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<{
    id: string;
    message: string;
    type: "info" | "warning" | "urgent";
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchBroadcast = async () => {
      try {
        const res = await fetch("/api/broadcast");
        if (res.ok) {
          const json = await res.json();
          if (json.broadcast) {
            const dismissedId =
              typeof window !== "undefined"
                ? sessionStorage.getItem("billease_dismissed_announcement")
                : null;
            if (dismissedId !== json.broadcast.id) {
              setAnnouncement(json.broadcast);
            }
          } else {
            setAnnouncement(null);
          }
        }
      } catch (e) {
        console.warn("Could not fetch live broadcast from server:", e);
      }
    };

    fetchBroadcast();
  }, []);

  if (!announcement || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("billease_dismissed_announcement", announcement.id);
    }
  };

  const bgStyles = {
    info: "bg-indigo-950/90 border-indigo-800/80 text-indigo-200",
    warning: "bg-amber-950/90 border-amber-800/80 text-amber-200",
    urgent: "bg-rose-950/90 border-rose-800/80 text-rose-200",
  }[announcement.type || "info"];

  return (
    <div className={`px-4 py-2 border-b text-xs font-semibold flex items-center justify-between gap-3 shadow-xs print:hidden ${bgStyles}`}>
      <div className="flex items-center gap-2 max-w-4xl">
        <Megaphone className="h-4 w-4 shrink-0 opacity-90 animate-bounce" />
        <span>{announcement.message}</span>
      </div>
      <button
        onClick={handleDismiss}
        title="Dismiss announcement"
        className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
