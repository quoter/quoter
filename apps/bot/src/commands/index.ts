import type { QuoterCommand } from "@/lib/command";

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

const allCommands: QuoterCommand[] = [
  EightBallCommand,
  AboutCommand,
  BugsCommand,
  CreateQuoteCommand,
  DeleteOwnQuoteCommand,
  DeleteQuoteCommand,
  EditOwnQuoteCommand,
  EditQuoteCommand,
  ExportCommand,
  ImportCommand,
  InspireCommand,
  ListQuotesCommand,
  QuoteThisCommand,
  QuoteCommand,
  SearchCommand,
  WhoQuotedCommand,
];

export const commands = new Map(allCommands.map((c) => [c.data.name, c]));
