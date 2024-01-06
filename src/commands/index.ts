/*
Copyright (C) 2020-2024 Nick Oates

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

import AboutCommand from "./about";
import BugsCommand from "./bugs";
import CreateQuoteCommand from "./create-quote";
import DeleteOwnQuoteCommand from "./delete-own-quote";
import DeleteQuoteCommand from "./delete-quote";
import EditOwnQuoteCommand from "./edit-own-quote";
import EditQuoteCommand from "./edit-quote";
import ExportCommand from "./export";
import InspireCommand from "./inspire";
import ListQuotesCommand from "./list-quotes";
import QuoteThisCommand from "./quote-this";
import QuoteCommand from "./quote";
import SearchCommand from "./search";
import WhoQuotedCommand from "./who-quoted";

const commands = {
	[AboutCommand.data.name]: AboutCommand,
	[BugsCommand.data.name]: BugsCommand,
	[CreateQuoteCommand.data.name]: CreateQuoteCommand,
	[DeleteOwnQuoteCommand.data.name]: DeleteOwnQuoteCommand,
	[DeleteQuoteCommand.data.name]: DeleteQuoteCommand,
	[EditOwnQuoteCommand.data.name]: EditOwnQuoteCommand,
	[EditQuoteCommand.data.name]: EditQuoteCommand,
	[ExportCommand.data.name]: ExportCommand,
	[InspireCommand.data.name]: InspireCommand,
	[ListQuotesCommand.data.name]: ListQuotesCommand,
	[QuoteThisCommand.data.name]: QuoteThisCommand,
	[QuoteCommand.data.name]: QuoteCommand,
	[SearchCommand.data.name]: SearchCommand,
	[WhoQuotedCommand.data.name]: WhoQuotedCommand,
};

export default commands;
