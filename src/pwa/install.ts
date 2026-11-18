interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const browser = navigator as Navigator & {
  standalone?: boolean;
  getInstalledRelatedApps?(): Promise<{ platform: string }[]>;
};
const appWindow = matchMedia("(display-mode: standalone), (display-mode: minimal-ui), (display-mode: window-controls-overlay)");
const events = new EventTarget();
const channel = typeof BroadcastChannel === "function" ? new BroadcastChannel("earcade-install") : null;
let available: InstallPrompt | null = null;
let prompting = false;
let installedHere = false;
let installedElsewhere = false;
let revision = 0;

function changed() {
  events.dispatchEvent(new Event("change"));
}

function installed() {
  revision++;
  installedHere = true;
  available = null;
  changed();
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  revision++;
  installedHere = false;
  installedElsewhere = false;
  available = event as InstallPrompt;
  changed();
});
window.addEventListener("appinstalled", () => {
  installed();
  channel?.postMessage("installed");
});
channel?.addEventListener("message", event => {
  if (event.data === "installed") installed();
});
appWindow.addEventListener("change", changed);

async function checkInstalled() {
  if (!browser.getInstalledRelatedApps || installedHere) return;
  const check = ++revision;
  try {
    const apps = await browser.getInstalledRelatedApps();
    if (check !== revision) return;
    // The manifest lists only Earcade itself.
    installedElsewhere = apps.some(app => app.platform === "webapp");
    if (installedElsewhere) available = null;
    changed();
  } catch {
    // Some browsers restrict this API in private windows.
  }
}
void checkInstalled();
window.addEventListener("pageshow", checkInstalled);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) void checkInstalled();
});

export function installState() {
  if (appWindow.matches || browser.standalone || installedHere || installedElsewhere) return "installed";
  if (prompting) return "prompting";
  return available ? "available" : "manual";
}

export function subscribeInstall(listener: () => void) {
  events.addEventListener("change", listener);
  return () => events.removeEventListener("change", listener);
}

export async function requestInstall() {
  if (installState() !== "available" || !available) return;
  const event = available;
  available = null; // Each browser event can be consumed exactly once.
  prompting = true;
  changed();
  try {
    await event.prompt();
    if ((await event.userChoice).outcome === "accepted") installed();
  } catch {
    return "manual";
  } finally {
    prompting = false;
    changed();
  }
}

export function installInstructions() {
  const ua = navigator.userAgent;
  if (!window.isSecureContext) return "Open Earcade over HTTPS to install it on this device.";
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    return "In Safari, tap Share, then Add to Home Screen. If shown, turn on Open as Web App, then tap Add.";
  }
  if (/Android/.test(ua)) return "Open your browser menu and choose Install app or Add to Home screen. If you opened this link inside another app, open it in Chrome first.";
  if (/Macintosh/.test(ua) && /Version\/.+Safari\//.test(ua)) {
    return "In Safari on macOS Sonoma or later, choose File → Add to Dock, then Add.";
  }
  if (/Firefox\//.test(ua) && /Windows/.test(ua)) return "In a supported version of Firefox for Windows, select the web apps button in the address bar to pin Earcade to your taskbar.";
  return "Look for the install icon in the address bar or the install option in your browser menu. If neither appears, open Earcade in Chrome or Edge.";
}
