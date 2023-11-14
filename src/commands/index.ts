/*
Copyright (C) 2020-2023 Nick Oates

This file is part of Quoter.

Quoter is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, version 3.

Quoter is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Quoter.  If not, see <https://www.gnu.org/licenses/>.
*/

import BugsCommand from "./bugs";
import DeleteQuoteCommand from "./deletequote";
import EditQuoteCommand from "./editquote";
import ExportCommand from "./export";
import InfoCommand from "./info";
import InspireCommand from "./inspire";
import ListQuotesCommand from "./listquotes";
import NewQuoteCommand from "./newquote";
import QuoteCommand from "./quote";
import QuoteThisCommand from "./quotethis";
import SearchCommand from "./search";
import WhoQuotedCommand from "./whoquoted";

const commands = {
	[BugsCommand.data.name]: BugsCommand,
	[DeleteQuoteCommand.data.name]: DeleteQuoteCommand,
	[EditQuoteCommand.data.name]: EditQuoteCommand,
	[ExportCommand.data.name]: ExportCommand,
	[InfoCommand.data.name]: InfoCommand,
	[InspireCommand.data.name]: InspireCommand,
	[ListQuotesCommand.data.name]: ListQuotesCommand,
	[NewQuoteCommand.data.name]: NewQuoteCommand,
	[QuoteCommand.data.name]: QuoteCommand,
	[QuoteThisCommand.data.name]: QuoteThisCommand,
	[SearchCommand.data.name]: SearchCommand,
	[WhoQuotedCommand.data.name]: WhoQuotedCommand,
};

export default commands;
