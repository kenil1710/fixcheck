/**
 * Uncached contract reads for the public API and the badge: every answer is
 * read from the chain for that request (no cache-only answers). Retries
 * Studio's transient "busy" answers; a persistent failure is an error, never
 * a guess.
 */
import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { plain } from "./plain";

const TRANSIENT = /busy|execution slots|rate limit|-32029|-32006|Unexpected token|not valid JSON|fetch failed|ECONNRESET|ETIMEDOUT|5\d\d/i;
let client: ReturnType<typeof createClient> | null = null;
const reader = () => (client ??= createClient({ chain: { ...studioDevnet } }));

export async function freshView<T>(address: `0x${string}`, fn: string, args: unknown[] = []): Promise<T> {
  let last: unknown;
  for (let i = 0; i < 4; i++) {
    try {
      return plain(await reader().readContract({ address, functionName: fn, args: args as never })) as T;
    } catch (e) {
      last = e;
      if (!TRANSIENT.test(String((e as Error)?.message ?? e))) break;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw last;
}
