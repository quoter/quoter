import { QuoteStore } from "@/db/quote-store";

let store: QuoteStore | undefined;

export function initializeStore(path: string): QuoteStore {
	if (store) throw new Error("Quote store is already initialized");
	store = new QuoteStore(path);
	return store;
}

export function getStore(): QuoteStore {
	if (!store) throw new Error("Quote store is not initialized");
	return store;
}

export function closeStore(): void {
	store?.close();
	store = undefined;
}

export { GuildQuoteLimitError, QuoteStore } from "@/db/quote-store";
