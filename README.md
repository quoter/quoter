<img align="right" height=128 width=128 src="logo.png" /></p>

# Quoter

[![version](https://img.shields.io/github/package-json/v/nchristopher/quoter)](https://github.com/nchristopher/quoter/releases/latest)
[![license](https://img.shields.io/github/license/nchristopher/quoter)](https://github.com/nchristopher/quoter/blob/main/LICENSE)
[![stars](https://img.shields.io/github/stars/nchristopher/quoter)](https://github.com/nchristopher/quoter/stargazers)
[![issues](https://img.shields.io/github/issues/nchristopher/quoter)](https://github.com/nchristopher/quoter/issues)

_Quoter_ is a Discord bot which stores quotes for servers & retrieves them on demand. It supports listing, (randomly) displaying, deleting, and editing quotes! You can invite the bot to your server [here](https://discord.com/api/oauth2/authorize?client_id=784853298271748136&permissions=19456&scope=bot%20applications.commands), or join the support server [here](https://discord.gg/QzXTgS2CNk).

## Commands

| Command        | Description                                                |
| -------------- | ---------------------------------------------------------- |
| `/quote`       | Views a specific quote, otherwise shows a random one.      |
| `/newquote`    | Creates a new quote.                                       |
| `/listquotes`  | Lists all of the server's quotes.                          |
| `/editquote`   | Edits the specified quote.                                 |
| `/deletequote` | Deletes the specified quote.                               |
| `/search`      | Search through the server's quotes.                        |
| `/allquote`    | Toggles whether everyone can create quotes.                |
| `/manageself`  | Toggles whether users can delete/edit quotes they created. |
| `/whoquoted`   | Shows who created a quote.                                 |
| `/info`        | Displays information about Quoter.                         |
| `/privacy`     | Shows Quoter's privacy policy.                             |
| `/bugs`        | Shows how to report bugs, suggest features, and more.      |

## Contributing

Thanks for your interest in contributing to Quoter! Before making any changes, [open an issue](https://github.com/nchristopher/quoter/issues) to make sure they're needed. Follow the project's [Code of Conduct](https://github.com/nchristopher/quoter/blob/main/CODE_OF_CONDUCT.md)!

### Setup

**Hosting Quoter yourself is not supported.** The recommended way to use the bot is through the [official, public instance](https://discord.com/api/oauth2/authorize?client_id=784853298271748136&permissions=19456&scope=bot%20applications.commands). These instructions are meant for contributors.

-   Quoter requires **Node.js `v16.13.1`** and **mongoDB `v3.0.0` or higher**.

1. Run `npm install` to install Quoter's dependencies.
2. Copy `config.json.EXAMPLE` to `config.json` & change as necessary.
    - You'll probably want to add your bot's `token`, and add your own user Id to the `admins` array.
3. Run `node deployCommands.js <client Id> [guild Id]` to register slash commands.
    - Replace `<client Id>` with your bot's Id & replace `[guild Id]` with your development guild.
    - When deploying to production, omit `[guild Id]` to create global slash commands, rather than guild ones.
4. Run the bot with `node .`!

Before committing any changes, run `npm run lint:fix` to run ESLint & Prettier. Address any issues ESLint has.

## License

    Copyright (C) 2020-2022 Nicholas Christopher

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, version 3.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
