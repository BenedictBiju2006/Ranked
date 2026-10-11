import type { SourceJsonObject } from "../../domain/knowledge-source.types";

export interface WikidataApiClient {
  get(parameters: Record<string, string>, signal?: AbortSignal): Promise<SourceJsonObject>;
}

export interface WikidataClientOptions {
  fetch?: typeof globalThis.fetch;
  userAgent?: string;
  timeoutMs?: number;
  maxRetries?: number;
  maxRetryDelayMs?: number;
}

export class WikidataRequestError extends Error {
  readonly code: string;
  readonly httpStatus: number | null;
  readonly retryable: boolean;
  readonly retryAfterMs: number | null;

  constructor(message: string, code: string, httpStatus: number | null = null, retryable = false, retryAfterMs: number | null = null) {
    super(message);
    this.name = "WikidataRequestError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}

function retryDelay(header: string | null): number | null {
  if (!header?.trim()) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const timestamp = Date.parse(header);
  return Number.isFinite(timestamp) ? Math.max(0, timestamp - Date.now()) : null;
}

function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw signal.reason ?? new DOMException("Request cancelled.", "AbortError");
}

function waitForRetry(milliseconds: number, signal?: AbortSignal): Promise<void> {
  checkAborted(signal);
  return new Promise((resolve, reject) => {
    const finish = () => { signal?.removeEventListener("abort", cancel); resolve(); };
    const timer = setTimeout(finish, milliseconds);
    const cancel = () => { clearTimeout(timer); signal?.removeEventListener("abort", cancel); reject(signal?.reason ?? new DOMException("Request cancelled.", "AbortError")); };
    signal?.addEventListener("abort", cancel, { once: true });
  });
}

export function createWikidataClient(options: WikidataClientOptions = {}): WikidataApiClient {
  const fetchRequest = options.fetch ?? globalThis.fetch.bind(globalThis);
  const userAgent = options.userAgent ?? "Ranked/0.1 (https://github.com/BenedictBiju2006/Ranked)";
  const timeoutMs = options.timeoutMs ?? 15_000;
  const maxRetries = options.maxRetries ?? 2;
  const maxRetryDelayMs = options.maxRetryDelayMs ?? 30_000;
  if (!userAgent.trim()) throw new Error("A descriptive Wikidata User-Agent is required.");
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("timeoutMs must be positive.");
  if (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 5) throw new Error("maxRetries must be between 0 and 5.");
  if (!Number.isFinite(maxRetryDelayMs) || maxRetryDelayMs < 0) throw new Error("maxRetryDelayMs must be nonnegative.");
  let queue: Promise<void> = Promise.resolve();

  async function requestOnce(parameters: Record<string, string>, signal?: AbortSignal): Promise<SourceJsonObject> {
    checkAborted(signal);
    const controller = new AbortController();
    const cancel = () => controller.abort(signal?.reason);
    signal?.addEventListener("abort", cancel, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);

    try {
      const url = new URL("https://www.wikidata.org/w/api.php");
      url.search = new URLSearchParams({ ...parameters, format: "json", formatversion: "2", maxlag: "5" }).toString();
      const response = await fetchRequest(url, { method: "GET", headers: { Accept: "application/json", "User-Agent": userAgent }, signal: controller.signal });
      const retryAfterMs = retryDelay(response.headers.get("Retry-After"));
      const payload: unknown = await response.json().catch(error => { if (response.ok) throw error; return null; });
      const data = payload && typeof payload === "object" && !Array.isArray(payload) ? payload as SourceJsonObject : null;
      if (data?.error && typeof data.error === "object" && !Array.isArray(data.error)) {
        const code = typeof data.error.code === "string" ? data.error.code : "api_error";
        const message = typeof data.error.info === "string" ? data.error.info : code;
        const minimumDelay = code === "maxlag" ? 5000 : 0;
        throw new WikidataRequestError(`Wikidata API: ${message}`, code, response.status, ["maxlag", "ratelimited"].includes(code), retryAfterMs === null && !minimumDelay ? null : Math.max(retryAfterMs ?? 0, minimumDelay));
      }
      if (!response.ok) throw new WikidataRequestError(`Wikidata returned HTTP ${response.status}.`, "http_error", response.status, [429, 500, 502, 503, 504].includes(response.status), retryAfterMs);
      if (!data) throw new WikidataRequestError("Wikidata returned an invalid JSON response.", "invalid_response");
      if (data.error !== undefined || data.success === 0) throw new WikidataRequestError("Wikidata returned an unsuccessful response.", "invalid_response");
      return data;
    } catch (error) {
      checkAborted(signal);
      if (timedOut) throw new WikidataRequestError("Wikidata request timed out.", "timeout", null, true);
      if (error instanceof WikidataRequestError) throw error;
      if (error instanceof SyntaxError) throw new WikidataRequestError("Wikidata returned malformed JSON.", "invalid_response");
      throw new WikidataRequestError("Wikidata network request failed.", "network_error", null, true);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
    }
  }

  async function requestWithRetry(parameters: Record<string, string>, signal?: AbortSignal): Promise<SourceJsonObject> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await requestOnce(parameters, signal);
      } catch (error) {
        if (!(error instanceof WikidataRequestError) || !error.retryable || attempt >= maxRetries) throw error;
        const delay = error.retryAfterMs ?? 500 * 2 ** attempt;
        if (delay > maxRetryDelayMs) throw error;
        await waitForRetry(delay, signal);
      }
    }
  }

  return {
    get(parameters, signal) {
      if (!["wbsearchentities", "wbgetentities"].includes(parameters.action)) return Promise.reject(new Error("The Wikidata client supports search and entity reads only."));
      const snapshot = { ...parameters };
      const result = queue.then(() => requestWithRetry(snapshot, signal));
      queue = result.then(() => undefined, () => undefined);
      return result;
    },
  };
}
