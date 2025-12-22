// src/buttons/blackjack.js
import { EmbedBuilder } from "discord.js";
import { playHit, playStand } from "../utils/blackjackCore.js";
import { createBlackjackEmbed } from "../utils/blackjackEmbed.js";
import { blackjackButtons } from "../utils/blackjackButtons.js";
import { getGame } from "../utils/blackjackStore.js";

export default {
  customId: /^bj-(hit|stand)$/,

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const action = interaction.customId.split("-")[1];

    const game = getGame(guildId, userId);

    // ❌ ゲームがない or 他人のゲーム
    if (!game) {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("❌ 操作できません")
        .setDescription("このブラックジャックはあなたのゲームではありません。");

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    let result;
    if (action === "hit") {
      result = playHit(guildId, userId);
    } else {
      result = playStand(guildId, userId);
    }

    if (result.error) {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`❌ ${result.error}`);

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    const embed = createBlackjackEmbed(result);
    const components = result.finished ? [] : [blackjackButtons(false)];

    await interaction.update({
      embeds: [embed],
      components
    });
  }
};
