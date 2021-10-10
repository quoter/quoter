/*
Copyright (C) 2020-2021 Nicholas Christopher

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

const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const Guild = require("../schemas/guild.js");

const render = (page, maxPage, quotes) => {
	const start = (page - 1) * 10;
	const end = start + 10;
	const slicedQuotes = quotes.slice(start, end);

	let quoteList = "";
	let quoteNumber = 1;
	slicedQuotes.forEach((quote) => {
		if (quote.text && quote.text.length > 30) {
			quote.text = `${quote.text.substr(0, 30)}...`;
		}
		if (quote.author && quote.author.length > 10) {
			quote.author = `${quote.author.substr(0, 10)}...`;
		}

		quoteList += `**${quoteNumber + (page - 1) * 10}**. "${
			quote.text || "An error occurred"
		}"`;
		quoteNumber++;

		if (quote.author && quote.author.length > 0) {
			quoteList += ` - ${quote.author}`;
		}

		quoteList += "\n";
	});

	const quoteListEmbed = new MessageEmbed()
		.setTitle(`📜 Server Quotes • Page #${page} of ${maxPage}`)
		.setColor("BLUE")
		.setDescription(`Use \`/quote\` to view a specific quote.

${quoteList}`);

	const row = new MessageActionRow().addComponents(
		new MessageButton()
			.setCustomId("prev")
			.setLabel("⬅️ Prev")
			.setStyle("PRIMARY")
			.setDisabled(page === 1),
		new MessageButton()
			.setCustomId("next")
			.setLabel("Next ➡️")
			.setStyle("PRIMARY")
			.setDisabled(page === maxPage)
	);

	return { embeds: [quoteListEmbed], components: [row], fetchReply: true };
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName("listquotes")
		.setDescription("Lists all of the server's quotes")
		.addIntegerOption((o) =>
			o.setName("page").setDescription("The page of quotes to view.")
		),
	cooldown: 3,
	guildOnly: true,
	async execute(interaction) {
		const { quotes } =
			interaction.db ??
			(await Guild.findOneAndUpdate(
				{ _id: interaction.guild.id },
				{},
				{ upsert: true, new: true }
			));

		if (!quotes.length) {
			return await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes, use `/newquote` to add some!",
				ephemeral: true,
			});
		}

		let page = interaction.options.getInteger("page") || 1;
		const maxPage = Math.ceil(quotes.length / 10);
		if (page > maxPage) {
			return await interaction.reply({
				content: `❌ **|** That page is too high! The maximum page is **${maxPage}**.`,
				ephemeral: true,
			});
		}

		const reply = await interaction.reply(render(page, maxPage, quotes));

		const filter = (p) => {
			if (p.user.id === interaction.user.id) {
				return true;
			} else {
				p.reply({
					content:
						"❌ **|** You clicked on someone else's button. Get your own with `/listquotes`!",
					ephemeral: true,
				});
			}
		};
		const awaitPress = async () => {
			try {
				const press = await reply.awaitMessageComponent({
					filter,
					componentType: "BUTTON",
					time: 35000,
				});

				const id = press.component.customId;
				if (id === "prev") {
					await press.update(render(--page, maxPage, quotes));
					await awaitPress();
				} else {
					await press.update(render(++page, maxPage, quotes));
					await awaitPress();
				}
			} catch {
				await reply.edit({ components: [] });
			}
		};
		await awaitPress();
	},
};
