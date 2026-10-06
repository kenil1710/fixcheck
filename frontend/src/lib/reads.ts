/**
 * Contract reads with a cache and a busy-retry.
 *
 * Studio Dev meters requests per IP and sometimes answers "Server busy" or an
 * HTML error page. Every read here retries those with backoff, caches good
 * answers for a short time, and on persistent failure returns { ok: false }
 * so a page renders an honest "network busy" state — never a guessed verdict.
 */
import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { DEPLOYMENTS, type Deployment } from "./deployments";
import { plain } from "./plain";
import type { Check, CheckCode, Config, Defender, Ledger, ProtocolScore, Stats } from "./types";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const TTL_MS = 20_000;
const cache = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();
let client: ReturnType<typeof createClient> | null = null;
const reader = () => (client ??= createClient({ chain: { ...studioDevnet } }));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const TRANSIENT = /busy|execution slots|rate limit|-32029|-32006|Unexpected token|not valid JSON|fetch failed|ECONNRESET|ETIMEDOUT|5\d\d/i;

export async function view<T>(dep: Deployment, fn: string, args: unknown[] = []): Promise<Result<T>> {
  const key = `${dep}:${fn}:${JSON.stringify(args)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return { ok: true, data: hit.value as T };
  if (!inflight.has(key)) {
    inflight.set(key, (async () => {
      let last: unknown;
      for (let i = 0; i < 4; i++) {
        try {
          const raw = await reader().readContract({ address: DEPLOYMENTS[dep].address, functionName: fn, args: args as never });
          const value = plain(raw);
          cache.set(key, { at: Date.now(), value });
          return value;
        } catch (e) {
          last = e;
          if (!TRANSIENT.test(String((e as Error)?.message ?? e))) break;
          await sleep(1200 * (i + 1));
        }
      }
      throw last;
    })().finally(() => inflight.delete(key)));
  }
  try {
    return { ok: true, data: (await inflight.get(key)) as T };
  } catch (e) {
    if (hit) return { ok: true, data: hit.value as T };
    const msg = String((e as Error)?.message ?? e);
    return { ok: false, error: /no check #/i.test(msg) ? "NOT_FOUND" : msg.slice(0, 200) };
  }
}

export const getStats = (d: Deployment = "canonical") => view<Stats>(d, "get_stats");
export const getProtocols = (d: Deployment = "canonical") => view<ProtocolScore[]>(d, "get_protocols");
export const getChecks = (d: Deployment = "canonical", offset = 0, limit = 100) =>
  view<{ total: number; offset: number; items: Check[] }>(d, "get_checks", [offset, limit]);
export const getProtocol = (key: string, d: Deployment = "canonical") =>
  view<ProtocolScore & { items: Check[] }>(d, "get_protocol", [key, 0, 100]);
export const getCheck = (id: number, d: Deployment = "canonical") => view<Check>(d, "get_check", [id]);
export const getCheckCode = (id: number, d: Deployment = "canonical") => view<CheckCode>(d, "get_check_code", [id]);
export const getDefenders = (id: number, d: Deployment = "canonical") => view<Defender[]>(d, "get_defenders", [id]);
export const getLedger = (d: Deployment = "canonical") => view<Ledger>(d, "get_ledger");
export const getConfig = (d: Deployment = "canonical") => view<Config>(d, "get_config");
