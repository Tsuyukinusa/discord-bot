import { addVXP } from "../services/levelingService.js";
import { readGuildDB, writeGuildDB } from "../utils/file.js";

export default {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    const member = newState.member;
    if (!member || member.user.bot) return;

    const guildId = member.guild.id;
    const userId = member.user.id;
    const guildData = await readGuildDB();
    guildData[guildId] ||= {};
    guildData[guildId].voiceSession ||= {};
    const session = guildData[guildId].voiceSession;
    const ignored = guildData[guildId].vxpIgnoreChannels || [];

    const oldChannel = oldState.channelId;
    const newChannel = newState.channelId;

    if (oldChannel && !newChannel && session[userId]) {
      const staySec = Math.floor((Date.now() - session[userId].joinedAt) / 1000);
      if (!ignored.includes(session[userId].channelId)) await addVXP(guildId, userId, Math.floor(staySec / 60));
      delete session[userId];
      await writeGuildDB(guildData);
      return;
    }

    if (!oldChannel && newChannel) {
      if (ignored.includes(newChannel)) return;
      session[userId] = { joinedAt: Date.now(), channelId: newChannel };
      await writeGuildDB(guildData);
      return;
    }

    if (oldChannel && newChannel && oldChannel !== newChannel) {
      if (session[userId] && !ignored.includes(session[userId].channelId)) {
        const staySec = Math.floor((Date.now() - session[userId].joinedAt) / 1000);
        await addVXP(guildId, userId, Math.floor(staySec / 60));
      }
      if (ignored.includes(newChannel)) {
        delete session[userId];
      } else {
        session[userId] = { joinedAt: Date.now(), channelId: newChannel };
      }
      await writeGuildDB(guildData);
    }
  },
};
