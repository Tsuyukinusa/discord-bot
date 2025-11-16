// src/events/voiceStateUpdate.js
import { addVXP } from "../services/levelingService.js";
import { readGuildDB, writeGuildDB } from "../utils/file.js";

export default {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    const member = newState.member;
    if (!member || member.user.bot) return;

    const guildId = member.guild.id;
    const userId = member.user.id;

    // ========= Guild DB 読み込み =========
    const guildData = await readGuildDB();
    guildData[guildId] ||= {};
    guildData[guildId].voiceSession ||= {}; // VC滞在記録

    const session = guildData[guildId].voiceSession;

    // ========= 除外VCチャンネル取得 =========
    const ignored = guildData[guildId].vxpIgnoreChannels || [];

    // ======== VC 入室時 ========
    if (!oldState.channelId && newState.channelId) {

      // 除外VCなら記録しない
      if (ignored.includes(newState.channelId)) return;

      session[userId] = {
        joinedAt: Date.now(),
        channelId: newState.channelId,
      };

      await writeGuildDB(guildData);
      return;
    }

    // ======== VC 退出時 ========
    if (oldState.channelId && !newState.channelId) {

      const record = session[userId];
      if (!record) return;

      const stayMs = Date.now() - record.joinedAt;
      const staySec = Math.floor(stayMs / 1000);

      // 除外VCならVxp付与しない
      if (!ignored.includes(record.channelId)) {
        const gain = Math.floor(staySec / 60); // 1分＝1Vxp
        if (gain > 0) {
          await addVXP(guildId, userId, gain);
        }
      }

      delete session[userId];
      await writeGuildDB(guildData);
    }
  },
};
