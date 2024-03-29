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

import { SlashCommandBuilder } from "discord.js";
import QuoterCommand from "../QuoterCommand";

const BugsCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("bugs")
		.setDescription(
			"Get a link to report bugs, suggest features, or post other issues",
		),
	async execute(interaction) {
		await interaction.reply({
			content:
				"🐛 **|** You can report bugs, suggest features, or post other issues on Quoter's [GitHub Issues](<https://github.com/n1ckoates/quoter/issues>) page.",
			ephemeral: true,
		});
	},
};

export default BugsCommand;
