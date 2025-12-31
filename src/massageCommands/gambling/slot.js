// src/messageCommands/slot.js
import { EmbedBuilder } from "discord.js";
import { playSlot } from "../utils/gamble/slot/slotLogic.js";
import { createSlotEmbed } from "../utils/gamble/slot/slotEmbed.js";
import { readGuildDB, writeGuildDB } from "../utils/core/file.js";

export default {
  name: "slot",

  async execute(message, args) {
    const guildId = message.guild.id;
    const userId = message.author.id;
    const bet = Number(args[0]);

    if (!bet || bet < 1) {
      return message.reply("使い方: `!slot 賭け金`");
    }

    const db = await readGuildDB();
    const user = db[guildId]?.users?.[userId];

    if (!user || user.balance < bet) {
      return message.reply("❌ 所持金が足りません");
    }

    const symbols = getSlotSymbols(guildId);
    if (!symbols || symbols.length === 0) {
      return message.reply("❌ スロットの絵文字が登録されていません");
    }

    // 実行
    user.balance -= bet;
    const result = playSlot({ bet, symbols });

    if (result.win) {
      user.money += result.payout;
    }

    await writeGuildDB(db);

    const embed = createSlotEmbed({
      ...result,
      bet
    });

    return message.reply({ embeds: [embed] });
  }
};
