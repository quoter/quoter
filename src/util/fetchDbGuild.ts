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

import { CommandInteraction } from "discord.js";
import { Guild } from "../schemas/guild";

export default async function fetchDbGuild(interaction: CommandInteraction) {
	if (!interaction.guild) {
		throw new Error("Interaction is not in a guild.");
	}

	return await Guild.findOneAndUpdate(
		{ _id: interaction.guild.id },
		{},
		{ upsert: true, new: true },
	);
}
