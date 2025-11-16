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

    // ====== データ読み込み ======
    const guildData = await readGuildDB();
    guildData[guildId] ||= {};
    guildData[guildId].voiceSession ||= {};

    const session = guildData[guildId].voiceSession;
    const ignored = guildData[guildId].vxpIgnoreChannels || [];

    const oldChannel = oldState.channelId;
    const newChannel = newState.channelId;

    // ========= ユーザーの記録を取得 =========
    let record = session[userId];

    // ========= VC退出時（oldあり newなし）=========
    if (oldChannel && !newChannel) {
      if (record) {
        const stayMs = Date.now() - record.joinedAt;
        const staySec = Math.floor(stayMs / 1000);

        if (!ignored.includes(record.channelId)) {
          const gain = Math.floor(staySec / 60); // 1分=1VXP
          if (gain > 0) await addVXP(guildId, userId, gain);
        }

        delete session[userId];
        await writeGuildDB(guildData);
      }
      return;
    }

    // ========= VC入室時（oldなし newあり）=========
    if (!oldChannel && newChannel) {
      if (ignored.includes(newChannel)) return;

      session[userId] = {
        joinedAt: Date.now(),
        channelId: newChannel,
      };

      await writeGuildDB(guildData);
      return;
    }

    // ========= VC移動時（oldあり newあり）=========
    if (oldChannel && newChannel && oldChannel !== newChannel) {
      // 1️⃣ 移動前のチャンネルで加算処理
      if (record) {
        const stayMs = Date.now() - record.joinedAt;
        const staySec = Math.floor(stayMs / 1000);

        if (!ignored.includes(record.channelId)) {
          const gain = Math.floor(staySec / 60);
          if (gain > 0) await addVXP(guildId, userId, gain);
        }
      }

      // 2️⃣ 新しいチャンネルが除外なら記録削除
      if (ignored.includes(newChannel)) {
        delete session[userId];
        await writeGuildDB(guildData);
        return;
      }

      // 3️⃣ 新チャンネルに joinedAt をリセット
      session[userId] = {
        joinedAt: Date.now(),
        channelId: newChannel,
      };

      await writeGuildDB(guildData);
      return;
    }
  },
};
