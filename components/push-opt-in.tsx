"use client";

import { useState } from "react";
import { Bell, BellRing, Check } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/** Checkbox that, when checked, registers the service worker + subscribes the browser to push
 *  notifications for the given tournament/team, and saves that subscription server-side. Drop
 *  this into any registration form where visitors should be able to opt into alerts. */
export function PushOptIn({
  tournamentName, teamName, contactEmail,
  label = "🔔 Get alerts for schedule changes & game results",
}: {
  tournamentName: string; teamName?: string; contactEmail?: string; label?: string;
}) {
  const [status, setStatus] = useState<"idle" | "subscribing" | "subscribed" | "denied" | "unsupported" | "error">("idle");

  async function handleToggle(checked: boolean) {
    if (!checked) { setStatus("idle"); return; }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      setStatus("error");
      return;
    }
    setStatus("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), tournamentName, teamName, contactEmail }),
      });
      setStatus("subscribed");
    } catch (err) {
      console.error("push subscribe failed:", err);
      setStatus("error");
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 select-none">
        <input
          type="checkbox"
          checked={status === "subscribed" || status === "subscribing"}
          onChange={(e) => handleToggle(e.target.checked)}
          disabled={status === "subscribing"}
          className="w-4 h-4 rounded accent-blue-600"
        />
        <span className="flex items-center gap-1.5">
          {status === "subscribed" ? <BellRing className="w-4 h-4 text-blue-400" /> : <Bell className="w-4 h-4 text-gray-500" />}
          {label}
        </span>
      </label>
      {status === "subscribing" && <p className="text-xs text-gray-500 pl-6">Requesting permission…</p>}
      {status === "subscribed" && <p className="text-xs text-emerald-400 pl-6 flex items-center gap-1"><Check className="w-3 h-3" /> You'll get notified here.</p>}
      {status === "denied" && <p className="text-xs text-amber-400 pl-6">Notifications were blocked — you can enable them later in your browser's site settings.</p>}
      {status === "unsupported" && <p className="text-xs text-gray-500 pl-6">Push notifications aren't supported in this browser.</p>}
      {status === "error" && <p className="text-xs text-red-400 pl-6">Couldn't enable notifications right now — you can still register normally.</p>}
    </div>
  );
}
