// src/buttons/poker.js
import { EmbedBuilder } from "discord.js";
import { getPokerGame, endPokerGame } from "../utils/gamble/poker/pokerStore.js";
import { exchangeCards, judgeAndPayout } from "../utils/gamble/poker/pokerCore.js";
import { createPokerEmbed } from "../utils/gamble/poker/pokerEmbed.js";

export default {
  customId: /^poker-(exchange|stand)$/,

  async execute(interaction) {
    const action = interaction.customId.split("-")[1];
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const game = getPokerGame(guildId, userId);
    if (!game) return interaction.deferUpdate();

    // 🔄 交換
    if (action === "exchange") {
      exchangeCards(game); // exchangeIndexes を使って山札から引く
    }

    // 勝敗確定 & 払い戻し
    const result = await judgeAndPayout({ guildId, userId, game });
    endPokerGame(guildId, userId);

    return interaction.update({
      embeds: [createPokerEmbed(result)],
      components: []
    });
  }
};
