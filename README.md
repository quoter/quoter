<div align="center">
	<h1>
		<a href="https://quoter.cc">
			<sub>
				<img
					src="https://github.com/quoter/quoter/assets/58091943/8a14590e-3f58-4cda-9553-d54c28f94ace"
					height="38"
				/>
			</sub>
			Quoter
		</a>
	</h1>
	Quoter is a Discord bot that allows you to save messages into a quote book,
	and share them with your friends. Add, edit, and delete quotes, then view
	them from a list, get one randomly, or even turn them into images.
    <br /><br />
	<a href="https://quoter.cc"
		><img
			src="https://github.com/quoter/quoter/assets/58091943/ae28168a-a967-4442-a878-5e26a8ab606c"
			alt="Website"
			height="36"
	/></a>
	&ensp;
	<a href="https://quoter.cc/invite"
		><img
			src="https://github.com/quoter/quoter/assets/58091943/b9af1f68-6279-44cb-8d4f-9f7ee85e74f6"
			alt="Add to Discord"
			height="36"
	/></a>
	&ensp;
</div>

## 🚀 Getting Started

The easiest way to use Quoter is with the official hosted version. You can add it to your server at [quoter.cc/invite](https://quoter.cc/invite).

If you want to host your own version, you can follow the instructions below.

## 🛠️ Self-Hosting (advanced)

While we support self-hosting, we do not provide any support for it. If you are not familiar with the technologies used, we recommend using the hosted version above.

You'll need [Bun](https://bun.sh) (we target the latest 1.x release) and a Discord bot. Create an application in [Discord's developer portal](https://discord.com/developers/applications), get its bot token, and invite it to your server, replacing `REPLACE_ME` with your bot's client ID:

```
https://discord.com/oauth2/authorize?scope=bot&client_id=REPLACE_ME
```

Clone the repository and install the dependencies:

```bash
git clone https://github.com/quoter/quoter.git
cd quoter
bun install
```

Copy `apps/bot/.env.EXAMPLE` to `apps/bot/.env` and set `DISCORD_TOKEN` to your bot's token. The other values are optional. Quotes are stored in a SQLite database at `DATABASE_PATH`, which is created on first start.

Deploy Slash Commands to Discord, then start the bot:

```bash
bun run deploy-commands
bun run start
```

**Upgrading from Quoter 5?** Quoter 6 replaces MongoDB with SQLite. See `apps/bot/scripts/migrate-mongo.ts` to convert your existing data.

## 🤝 Contributing

Thank you for your interest in contributing to Quoter! Before you get started, please read our [Code of Conduct](CODE_OF_CONDUCT.md). If you're developing a new feature, or making significant changes, please open an issue first to discuss it with us.

Quoter is written in [TypeScript](https://www.typescriptlang.org) and uses [Bun](https://bun.sh) as a runtime and package manager, with [SQLite](https://sqlite.org) for data storage. We use [Ultracite](https://ultracite.ai) to enforce code style.

To get started, follow the self-hosting guide above, but clone your fork instead of the main repository. Set `DISCORD_GUILD_ID` to your test server and use `bun run deploy-commands --guild` to deploy commands only to that server.

Before submitting a pull request, please run `bun run check` to lint, typecheck, test, and build.

## 📜 License

    Copyright (C) 2020-2026 Nick Oates

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, version 3.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
