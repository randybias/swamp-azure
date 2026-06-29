import { z } from "npm:zod@4.3.6";

/**
 * Shared client, schema, and context types for the `@dougschaefer/azure-face`
 * model type (folded into the `@dougschaefer/azure` extension).
 *
 * This type wraps the Azure AI Vision Face REST API
 * (https://learn.microsoft.com/en-us/rest/api/face/). Authentication uses a
 * subscription key passed as the `Ocp-Apim-Subscription-Key` header on every
 * request. Unlike the rest of the `@dougschaefer/azure` extension (which shells
 * out to `az` and reuses an `az login` session), the Face API is a data-plane
 * REST service keyed by a resource subscription key, so this type keeps its own
 * fetch-based client and its own global-arguments schema rather than the shared
 * `AzureGlobalArgsSchema` in `_helpers.ts`.
 *
 * Credentials are resolved from vault and must NOT be hardcoded. Extensions
 * have no vault API in model context — the values arrive via globalArguments,
 * populated from the `azure-face` vault (keys `endpoint` and `key`):
 *
 *   endpoint: ${{ vault.get(azure-face, endpoint) }}
 *   key:      ${{ vault.get(azure-face, key) }}
 *
 * Plain `fetch` is used throughout — no native-addon npm libs, so the bundle
 * has no native dependencies.
 *
 * NOTE: 1:N Identify (the `identify` method) requires Microsoft Limited Access
 * approval for the Azure Face API. The scaffold is complete; live calls will
 * not work until Limited Access is granted and the resource is provisioned.
 * See: https://learn.microsoft.com/en-us/azure/ai-services/cognitive-services-limited-access
 */

/** Connection + credentials for one Azure Face resource. */
export const AzureFaceGlobalArgsSchema = z.object({
  endpoint: z.string().describe(
    "Azure Face resource endpoint, e.g. https://<resource>.cognitiveservices.azure.com. Use: ${{ vault.get(azure-face, endpoint) }}",
  ),
  key: z.string().meta({ sensitive: true }).describe(
    "Azure Cognitive Services subscription key. Use: ${{ vault.get(azure-face, key) }}",
  ),
  apiVersion: z.string().default("1.0").describe(
    "Face API version path segment (default: 1.0)",
  ),
  timeoutMs: z.number().int().default(30000).describe(
    "Per-request timeout in milliseconds",
  ),
});

/** Resolved connection + credentials for one Azure Face resource. */
export type AzureFaceGlobalArgs = z.infer<typeof AzureFaceGlobalArgsSchema>;

/** Trim any trailing slashes from a URL string. */
function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Build the base URL for the Face API.
 * Paths are under `/face/v{apiVersion}/`, e.g. `/face/v1.0/detect`.
 */
export function faceBaseUrl(g: AzureFaceGlobalArgs): string {
  return `${trimSlash(g.endpoint)}/face/v${g.apiVersion}`;
}

/**
 * Low-level Face REST request. Appends the subscription key header, resolves
 * the JSON body, and throws on non-2xx, surfacing Azure's `error.message`.
 *
 * @param g - resolved globalArgs from the method context
 * @param method - HTTP verb
 * @param path - path relative to the Face API base (e.g. `/detect`)
 * @param opts - optional JSON body and additional query params
 */
export async function faceRequest(
  g: AzureFaceGlobalArgs,
  method: string,
  path: string,
  opts: {
    query?: Record<string, string>;
    json?: unknown;
  } = {},
): Promise<{ status: number; data: unknown }> {
  const url = new URL(faceBaseUrl(g) + path);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const headers: Record<string, string> = {
    "Ocp-Apim-Subscription-Key": g.key,
    "accept": "application/json",
  };
  let body: string | undefined;
  if (opts.json !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(opts.json);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), g.timeoutMs);
  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const msg = azureErrorMessage(data) ?? text.slice(0, 400);
    throw new Error(`Face ${method} ${path} -> HTTP ${res.status}: ${msg}`);
  }
  return { status: res.status, data };
}

/** Extract Azure's `{ error: { message } }` detail from a response body. */
function azureErrorMessage(data: unknown): string | undefined {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const err = d.error as Record<string, unknown> | undefined;
    if (err && typeof err.message === "string") return err.message;
    if (typeof d.message === "string") return d.message;
  }
  return undefined;
}

/**
 * Turn an arbitrary string into a short, file-name-safe slug for use as a
 * data instance name. Callers prefix it per method (e.g. `detect-`, `pg-`).
 */
export function slugify(value: string, fallback = "default"): string {
  return value
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || fallback;
}

/** Minimal shape of the swamp method context this model uses. */
export interface MethodContext {
  globalArgs: AzureFaceGlobalArgs;
  logger: {
    info: (msg: string, props?: Record<string, unknown>) => void;
    warning: (msg: string, props?: Record<string, unknown>) => void;
  };
  writeResource: (
    spec: string,
    instance: string,
    data: Record<string, unknown>,
  ) => Promise<DataHandle>;
}

/** Reference returned by `writeResource`, returned from a method's execute. */
export interface DataHandle {
  name: string;
  specName: string;
}
