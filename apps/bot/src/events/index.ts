import { guildCreate } from "@/events/guild-create";
import { guildDelete } from "@/events/guild-delete";
import { interactionCreate } from "@/events/interaction-create";
import { ready } from "@/events/ready";

export const events = {
	guildCreate,
	guildDelete,
	interactionCreate,
	ready,
};
