"use client";
/** A fresh contract read from the browser (no cache), for confirming a write's effect. */
export async function readNow<T>(address: `0x${string}`, fn: string, args: unknown[] = []): Promise<T> {
  const { getReadClient, plain } = await import("./genlayer");
  return plain<T>(await getReadClient().readContract({ address, functionName: fn, args: args as never }));
}
