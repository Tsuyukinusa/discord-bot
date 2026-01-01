// src/messageCommands/gambling/slot.js
import { EmbedBuilder } from "discord.js";
import { playSlot } from "../../utils/gamble/slot/slotLogic.js";
import { createSlotEmbed } from "../../utils/gamble/slot/slotEmbed.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";
import { getSlotSymbols } from "../../utils/gamble/slot/slotSymbols.js";

export default {
  name: "slot",

  async execute(message, args) {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const bet = Number(args[0]);

    // --- 入力チェック ---
    if (!Number.isInteger(bet) || bet <= 0) {
      return message.reply("使い方: `!slot 賭け金`");
    }

    const db = await readGuildDB();

    // --- ユーザー初期化 ---
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].users) db[guildId].users = {};
    if (!db[guildId].users[userId]) {
      db[guildId].users[userId] = {
        balance: 0,
        bank: 0
      };
    }

    const user = db[guildId].users[userId];

    // --- 残高チェック ---
    if (user.balance < bet) {
      return message.reply("❌ 所持金が足りません");
    }

    // --- スロット設定取得 ---
    const symbols = getSlotSymbols(guildId);
    if (!symbols || symbols.length === 0) {
      return message.reply("❌ スロットの絵文字が登録されていません");
    }

    // ======================
    //        実行
    // ======================
    user.balance -= bet;

    const result = playSlot({ bet, symbols });

    if (result.win) {
      user.balance += result.payout;
    }

    await writeGuildDB(db);

    // --- Embed ---
    const embed = createSlotEmbed(result, bet);

    return message.reply({ embeds: [embed] });
  }
};
