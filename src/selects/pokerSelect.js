// src/selects/pokerSelect.js
import { getPokerGame, savePokerGame } from "../utils/gamble/poker/pokerStore.js";

export default {
  customId: "poker-select",

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const game = getPokerGame(guildId, userId);
    if (!game) return interaction.deferUpdate();

    // 選択されたカード index 配列
    game.exchangeIndexes = interaction.values.map(v => Number(v));
    savePokerGame(guildId, userId, game);

    await interaction.deferUpdate();
  }
};
