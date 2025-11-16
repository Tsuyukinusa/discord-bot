// src/events/messageCreate.js
import { addXP } from "../services/levelingService.js";
import { readGuildDB } from "../utils/file.js";

export default {
  name: "messageCreate",
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    // ==========================
    // 📌 XP 除外チャンネルチェック
    // ==========================
    const guildData = await readGuildDB();

    const ignoredChannels =
      guildData[guildId]?.xpIgnoreChannels || [];

    if (ignoredChannels.includes(message.channel.id)) {
      return; // このチャンネルではXPを加算しない
    }

    // ==========================
    // 📌 XP加算処理
    // ==========================
    const xpGain = Math.floor(Math.random() * 5) + 3; // 3～7

    const result = await addXP(guildId, userId, xpGain);

    if (result?.leveledUp) {
      await message.channel.send(
        `🎉 <@${userId}> が **レベル ${result.newLevel}** に到達！`
      );

      if (result.roleReward) {
        const role = message.guild.roles.cache.get(result.roleReward);
        if (role) {
          const member = await message.guild.members.fetch(userId);
          if (!member.roles.cache.has(role.id)) {
            await member.roles.add(role);
            await message.channel.send(
              `🏅 <@${userId}> に **${role.name}** を付与しました！`
            );
          }
        }
      }
    }
  },
};
