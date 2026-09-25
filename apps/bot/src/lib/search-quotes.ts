import Fuse from "fuse.js";
import type { Quote } from "@/db";

export type SearchCandidate = Pick<Quote, "quoteNumber" | "text" | "author">;

export function searchQuotes(
	quotes: SearchCandidate[],
	term: string,
	limit: number = 5,
): SearchCandidate[] {
	const fuse = new Fuse(quotes, {
		keys: ["text", "author"],
		threshold: 0.4,
	});
	return fuse.search(term, { limit }).map(({ item }) => item);
}
