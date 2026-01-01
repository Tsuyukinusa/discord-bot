import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { playSlot } from "../../utils/gamble/slot/slotLogic.js";
import { createSlotEmbed } from "../../utils/gamble/slot/slotEmbed.js";
import {
  canAfford,
  subtractBalance,
  addBalance
} from "../../Services/economyServices.js";
import { readGuildDB } from "../../utils/core/file.js";

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

    if (!(await canAfford(guildId, userId, bet))) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ 所持金が足りません")
        ],
        ephemeral: true
      });
    }

    const db = await readGuildDB();
    const symbols = db[guildId]?.slotSymbols;

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

    // 賭け金を引く
    await subtractBalance(guildId, userId, bet);

    const result = playSlot({ bet, symbols });

    if (result.win) {
      await addBalance(guildId, userId, result.payout);
    }

    return interaction.reply({
      embeds: [
        createSlotEmbed({
          ...result,
          bet
        })
      ]
    });
  }
};
