import { BrowserUse as BrowserUseV3 } from "browser-use-sdk/v3";
import { BrowserUse as BrowserUseV2 } from "browser-use-sdk";

// Server-only — no NEXT_PUBLIC_ prefix, never exposed to the browser
const apiKey = process.env.BROWSER_USE_API_KEY ?? "";
const v3 = new BrowserUseV3({ apiKey });
const v2 = new BrowserUseV2({ apiKey });

export const client = v3;
export const clientV2 = v2;
