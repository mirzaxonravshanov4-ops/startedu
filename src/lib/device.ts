import { supabase } from "@/integrations/supabase/client";

const KEY = "startedu-device-key";

export function getDeviceKey(): string {
  if (typeof window === "undefined") return "";
  let key = localStorage.getItem(KEY);
  if (!key) {
    key = crypto.randomUUID();
    localStorage.setItem(KEY, key);
  }
  return key;
}

function parseUA(ua: string) {
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Brauzer";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Noma'lum tizim";
  return { isMobile, browser, os };
}

/** Records/refreshes the current browser as a device of the signed-in user. */
export async function recordCurrentDevice(userId: string) {
  if (typeof window === "undefined") return;
  const ua = navigator.userAgent;
  const { isMobile, browser, os } = parseUA(ua);
  await supabase.from("user_devices").upsert(
    {
      user_id: userId,
      device_key: getDeviceKey(),
      device_name: `${browser} — ${os}`,
      browser,
      os,
      is_mobile: isMobile,
      user_agent: ua.slice(0, 400),
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,device_key" },
  );
}
