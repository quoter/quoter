CREATE TABLE `guilds` (
	`guild_id` text PRIMARY KEY NOT NULL,
	`next_quote_number` integer DEFAULT 1 NOT NULL,
	`max_quotes` integer,
	`last_seen_at` integer NOT NULL,
	`left_at` integer,
	`created_at` integer NOT NULL,
	CONSTRAINT "guilds_next_quote_number_positive" CHECK("guilds"."next_quote_number" >= 1),
	CONSTRAINT "guilds_max_quotes_nonnegative" CHECK("guilds"."max_quotes" IS NULL OR "guilds"."max_quotes" >= 0),
	CONSTRAINT "guilds_last_seen_nonnegative" CHECK("guilds"."last_seen_at" >= 0),
	CONSTRAINT "guilds_left_at_nonnegative" CHECK("guilds"."left_at" IS NULL OR "guilds"."left_at" >= 0),
	CONSTRAINT "guilds_created_at_nonnegative" CHECK("guilds"."created_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `guilds_last_seen` ON `guilds` (`last_seen_at`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`guild_id` text NOT NULL,
	`quote_number` integer NOT NULL,
	`text` text NOT NULL,
	`author` text,
	`quoter_id` text,
	`editor_id` text,
	`original_message_id` text,
	`original_channel_id` text,
	`created_at` integer NOT NULL,
	`edited_at` integer,
	PRIMARY KEY(`guild_id`, `quote_number`),
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`guild_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "quotes_number_positive" CHECK("quotes"."quote_number" >= 1),
	CONSTRAINT "quotes_text_present" CHECK(length("quotes"."text") > 0),
	CONSTRAINT "quotes_created_at_nonnegative" CHECK("quotes"."created_at" >= 0),
	CONSTRAINT "quotes_edited_at_nonnegative" CHECK("quotes"."edited_at" IS NULL OR "quotes"."edited_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `quotes_guild_author` ON `quotes` (`guild_id`,"author" COLLATE NOCASE);
