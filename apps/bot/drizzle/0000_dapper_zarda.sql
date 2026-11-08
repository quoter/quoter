CREATE TABLE `guilds` (
	`created_at` integer NOT NULL,
	`guild_id` text PRIMARY KEY NOT NULL,
	`left_at` integer,
	`max_quotes` integer,
	`next_quote_number` integer DEFAULT 1 NOT NULL,
	CONSTRAINT "guilds_next_quote_number_positive" CHECK("guilds"."next_quote_number" >= 1),
	CONSTRAINT "guilds_max_quotes_nonnegative" CHECK("guilds"."max_quotes" IS NULL OR "guilds"."max_quotes" >= 0),
	CONSTRAINT "guilds_left_at_nonnegative" CHECK("guilds"."left_at" IS NULL OR "guilds"."left_at" >= 0),
	CONSTRAINT "guilds_created_at_nonnegative" CHECK("guilds"."created_at" >= 0)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`author` text,
	`created_at` integer NOT NULL,
	`edited_at` integer,
	`editor_id` text,
	`guild_id` text NOT NULL,
	`original_channel_id` text,
	`original_message_id` text,
	`quote_number` integer NOT NULL,
	`quoter_id` text,
	`text` text NOT NULL,
	PRIMARY KEY(`guild_id`, `quote_number`),
	FOREIGN KEY (`guild_id`) REFERENCES `guilds`(`guild_id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "quotes_number_positive" CHECK("quotes"."quote_number" >= 1),
	CONSTRAINT "quotes_text_present" CHECK(length("quotes"."text") > 0),
	CONSTRAINT "quotes_created_at_nonnegative" CHECK("quotes"."created_at" >= 0),
	CONSTRAINT "quotes_edited_at_nonnegative" CHECK("quotes"."edited_at" IS NULL OR "quotes"."edited_at" >= 0)
);
--> statement-breakpoint
CREATE INDEX `quotes_guild_author` ON `quotes` (`guild_id`,"author" COLLATE NOCASE);