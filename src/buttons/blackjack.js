// src/buttons/blackjack.js
import { playHit, playStand } from "../utils/blackjackCore.js";
import { createBlackjackEmbed } from "../utils/blackjackEmbed.js";
import { blackjackButtons } from "../utils/blackjackButtons.js";

export default {
  customId: /^bj-(hit|stand)$/,

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const action = interaction.customId.split("-")[1];

    let result;
    if (action === "hit") {
      result = playHit(guildId, userId);
    } else {
      result = playStand(guildId, userId);
    }

    // ❌ エラー処理
    if (result.error) {
      return interaction.followUp({
        content: `❌ ${result.error}`,
        ephemeral: true
      });
    }

    // ❌ 他人操作防止
    if (result.playerId !== userId) {
      return interaction.followUp({
        content: "❌ このブラックジャックはあなたのゲームではありません。",
        ephemeral: true
      });
    }

    const embed = createBlackjackEmbed(result);
    const components = result.finished
      ? []
      : [blackjackButtons(false)];

    await interaction.update({
      embeds: [embed],
      components
    });
  }
};
