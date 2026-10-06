/**
 * Wallet helpers with NO genlayer-js import, so the header and every page stay
 * light. genlayer-js loads only when something is signed or read in the browser.
 */
export const CHAIN_ID = 61997;
export const CHAIN_ID_HEX = `0x${CHAIN_ID.toString(16)}`;
const RPC = "https://studio-dev.genlayer.com/api";
const EXPLORER = "https://explorer-studio-dev.genlayer.com";

export type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
};
declare global {
  interface Window { ethereum?: EthereumProvider }
}

export function hasInjectedWallet(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum);
}
export async function getWalletChainId(): Promise<string | null> {
  if (!hasInjectedWallet()) return null;
  try {
    const id = await window.ethereum!.request({ method: "eth_chainId" });
    return typeof id === "string" ? id.toLowerCase() : null;
  } catch { return null; }
}
export async function switchToNetwork(): Promise<void> {
  if (!hasInjectedWallet()) throw new Error("No injected wallet found. Install MetaMask to continue.");
  try {
    await window.ethereum!.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID_HEX }] });
  } catch (error) {
    if ((error as { code?: number })?.code !== 4902) throw error;
    await window.ethereum!.request({ method: "wallet_addEthereumChain", params: [{
      chainId: CHAIN_ID_HEX, chainName: "GenLayer Studio Devnet", rpcUrls: [RPC],
      nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 }, blockExplorerUrls: [EXPLORER] }] });
  }
}
export async function requestAccount(): Promise<`0x${string}`> {
  if (!hasInjectedWallet()) throw new Error("No injected wallet found. Install MetaMask to continue.");
  const accounts = (await window.ethereum!.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts?.length) throw new Error("Wallet returned no accounts.");
  return accounts[0] as `0x${string}`;
}
export const ensureCorrectNetwork = async () => { if (hasInjectedWallet()) await switchToNetwork(); };
