import { Events } from "discord.js";
import { readGuildDB, writeGuildDB } from "../utils/core/file.js";
import { addBalance } from "../Services/economyServices.js";

export default {
  name: Events.MessageReactionAdd,

  async execute(reaction, user) {
    // Botのリアクション無視
    if (user.bot) return;

    // partial対策
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch {
        return;
      }
    }

    const message = reaction.message;
    const guild = message.guild;
    if (!guild) return;

    const guildId = guild.id;
    const userId = message.author.id;

    // 自分の投稿へのリアクションは無視
    if (userId === user.id) return;

    const db = await readGuildDB();
    const income = db[guildId]?.income;
    if (!income) return;

    const {
      roleId,
      channelId,
      payPerReaction
    } = income;

    // チャンネル判定
    if (message.channel.id !== channelId) return;

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;

    // ロール判定
    if (!member.roles.cache.has(roleId)) return;

    // --- ユーザー初期化 ---
    if (!db[guildId].users) db[guildId].users = {};
    if (!db[guildId].users[userId]) {
      db[guildId].users[userId] = {
        balance: 0,
        bank: 0,
        xp: 0,
        vxp: 0,
        inventory: {}
      };
      await writeGuildDB(db);
    }

    // --- 給料付与（唯一の正ルート） ---
    await addBalance(guildId, userId, payPerReaction);
  }
};
