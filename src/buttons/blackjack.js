// src/buttons/blackjack.js
import { EmbedBuilder } from "discord.js";
import {
  playHit,
  playStand,
  playDouble,
  playSplit,
  switchHand
} from "../utils/gamble/blackjackCore.js";
import { createBlackjackEmbed } from "../utils/gamble/blackjackEmbed.js";
import { blackjackButtons } from "../utils/gamble/blackjackButtons.js";
import { getGame } from "../utils/gamble/blackjackStore.js";

export default {
  customId: /^bj-(hit|stand|double|split|hand)$/,

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const action = interaction.customId.split("-")[1];

    const game = getGame(guildId, userId);

    /* ======================
       他人操作ブロック
    ====================== */
    if (!game || game.userId !== userId) {
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

    /* ======================
       アクション分岐
    ====================== */
    switch (action) {
      case "hit":
        result = await playHit(guildId, userId);
        break;

      case "stand":
        result = await playStand(guildId, userId);
        break;

      case "double":
        result = await playDouble(guildId, userId);
        break;

      case "split":
        result = await playSplit(guildId, userId);
        break;

      case "hand":
        result = switchHand(guildId, userId);
        break;

      default:
        return;
    }

    /* ======================
       エラー処理（Embed）
    ====================== */
    if (result?.error) {
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`❌ ${result.error}`);

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    /* ======================
       表示更新
    ====================== */
    const embed = createBlackjackEmbed(result);
    const components = result.finished
      ? []
      : blackjackButtons(result);

    await interaction.update({
      embeds: [embed],
      components
    });
  }
};
