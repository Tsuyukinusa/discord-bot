import { addXP } from "../services/levelingService.js";
import { readGuildDB } from "../utils/core/file.js";

export default {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;
    const guildData = await readGuildDB();
    const ignoredChannels = guildData[guildId]?.xpIgnoreChannels || [];

    if (ignoredChannels.includes(message.channel.id)) return;

    const xpGain = Math.floor(Math.random() * 5) + 3;
    const result = await addXP(guildId, userId, xpGain);

    if (result?.leveledUp) {
      await message.channel.send(
        `🎉 <@${userId}> が **レベル ${result.newLevel}** に到達！`
      );
    }
  },
};
