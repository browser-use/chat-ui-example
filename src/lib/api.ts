import { BrowserUse as BrowserUseV3 } from "browser-use-sdk/v3";
import { BrowserUse as BrowserUseV2 } from "browser-use-sdk";

const apiKey = process.env.NEXT_PUBLIC_BROWSER_USE_API_KEY ?? "";
const v3 = new BrowserUseV3({ apiKey });
const v2 = new BrowserUseV2({ apiKey });

export const client = v3;

// ── Sessions (v3) ──

export async function createSession(opts: {
  model: string;
  profileId?: string;
  workspaceId?: string;
  proxyCountryCode?: string;
  enableRecording?: boolean;
}) {
  return v3.sessions.create({
    model: opts.model as "bu-mini" | "bu-max",
    keepAlive: true,
    ...(opts.profileId && { profileId: opts.profileId }),
    ...(opts.workspaceId && { workspaceId: opts.workspaceId }),
    ...(opts.proxyCountryCode && { proxyCountryCode: opts.proxyCountryCode as any }),
    ...(opts.enableRecording && { enableRecording: true }),
  });
}

export async function stopTask(id: string) {
  await v3.sessions.stop(id, { strategy: "task" });
}

export async function waitForRecording(id: string) {
  return v3.sessions.waitForRecording(id);
}

// ── Profiles (v2 — profiles endpoint exists in v3 OpenAPI but not yet in the SDK client) ──

export async function listProfiles() {
  return v2.profiles.list({ pageSize: 100 });
}

// ── Workspaces (v3) ──

export async function listWorkspaces() {
  return v3.workspaces.list({ pageSize: 100 });
}
