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

import { Guild as DiscordGuild } from "discord.js";
import { Guild } from "../schemas/guild";

export default async function guildDelete(guild: DiscordGuild) {
	await Guild.deleteOne({ _id: guild.id });
	console.log(`Deleted data for guild ${guild.name} (${guild.id})`);
}
