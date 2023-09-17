import BugsCommand from "./bugs";
import DeleteQuoteCommand from "./deletequote";
import ExportCommand from "./export";
import InfoCommand from "./info";
import QuoteThisCommand from "./quotethis";

const commands = {
	[BugsCommand.data.name]: BugsCommand,
	[DeleteQuoteCommand.data.name]: DeleteQuoteCommand,
	[ExportCommand.data.name]: ExportCommand,
	[InfoCommand.data.name]: InfoCommand,
	[QuoteThisCommand.data.name]: QuoteThisCommand,
};

export default commands;
