import { afterEach, beforeEach, expect, test } from "bun:test";

import { serializeQuotes } from "@/commands/export";
import { createImportSchema } from "@/commands/import";
import {
  closeDatabase,
  createQuote,
  exportQuotes,
  initializeDatabase,
  updateQuote,
} from "@/db";

beforeEach(() => initializeDatabase());
afterEach(() => closeDatabase());

test("/import accepts files from /export", () => {
  createQuote("guild", { createdAt: 1000, text: "unedited" }, 100);
  createQuote("guild", { author: "Nick", createdAt: 1000, text: "old" }, 100);
  updateQuote("guild", 2, { editedAt: 2000, editorId: "1", text: "edited" });

  const exported = JSON.parse(serializeQuotes(exportQuotes("guild")));
  const parsed = createImportSchema(250).safeParse(exported);

  expect(parsed.success).toBeTrue();
  expect(exported).toEqual([
    { createdTimestamp: 1000, quoteNumber: 1, text: "unedited" },
    {
      author: "Nick",
      createdTimestamp: 1000,
      editedTimestamp: 2000,
      quoteNumber: 2,
      text: "edited",
    },
  ]);
});
