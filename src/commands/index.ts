import type {
	CommandInteraction,
	ContextMenuCommandBuilder,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
} from "discord.js";
import EightBallCommand from "./8-ball";
import AboutCommand from "./about";
import BugsCommand from "./bugs";
import CreateQuoteCommand from "./create-quote";
import DeleteOwnQuoteCommand from "./delete-own-quote";
import DeleteQuoteCommand from "./delete-quote";
import EditOwnQuoteCommand from "./edit-own-quote";
import EditQuoteCommand from "./edit-quote";
import ExportCommand from "./export";
import ImportCommand from "./import";
import InspireCommand from "./inspire";
import ListQuotesCommand from "./list-quotes";
import QuoteCommand from "./quote";
import QuoteThisCommand from "./quote-this";
import SearchCommand from "./search";
import WhoQuotedCommand from "./who-quoted";

export type QuoterCommand = {
	data:
		| SlashCommandBuilder
		| ContextMenuCommandBuilder
		| SlashCommandOptionsOnlyBuilder;
	cooldown?: number;
	execute(interaction: CommandInteraction): Promise<void>;
};

export const commands = {
	[EightBallCommand.data.name]: EightBallCommand,
	[AboutCommand.data.name]: AboutCommand,
	[BugsCommand.data.name]: BugsCommand,
	[CreateQuoteCommand.data.name]: CreateQuoteCommand,
	[DeleteOwnQuoteCommand.data.name]: DeleteOwnQuoteCommand,
	[DeleteQuoteCommand.data.name]: DeleteQuoteCommand,
	[EditOwnQuoteCommand.data.name]: EditOwnQuoteCommand,
	[EditQuoteCommand.data.name]: EditQuoteCommand,
	[ExportCommand.data.name]: ExportCommand,
	[ImportCommand.data.name]: ImportCommand,
	[InspireCommand.data.name]: InspireCommand,
	[ListQuotesCommand.data.name]: ListQuotesCommand,
	[QuoteThisCommand.data.name]: QuoteThisCommand,
	[QuoteCommand.data.name]: QuoteCommand,
	[SearchCommand.data.name]: SearchCommand,
	[WhoQuotedCommand.data.name]: WhoQuotedCommand,
};
