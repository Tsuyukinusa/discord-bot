
// src/commands/gambling/slot.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { playSlot } from "../../utils/gamble/slot/slotLogic.js";
import { createSlotEmbed } from "../../utils/gamble/slot/slotEmbed.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";
import { getSlotSymbols } from "../../utils/gamble/slot/slotSymbols.js";

export default {
  data: new SlashCommandBuilder()
    .setName("slot")
    .setDescription("スロットを回します")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("賭け金")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const bet = interaction.options.getInteger("bet");

    const db = await readGuildDB();
    const user = db[guildId]?.users?.[userId];

    if (!user || user.money < bet) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ 所持金が足りません")
        ],
        ephemeral: true
      });
    }

    const symbols = getSlotSymbols(guildId);
    if (!symbols || symbols.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ スロットの絵文字が登録されていません")
        ],
        ephemeral: true
      });
    }

    // 実行
    user.money -= bet;
    const result = playSlot({ bet, symbols });

    if (result.win) {
      user.money += result.payout;
    }

    await writeGuildDB(db);

    const embed = createSlotEmbed({
      ...result,
      bet
    });

    return interaction.reply({ embeds: [embed] });
  }
};
