import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import {
  startBlackjack,
  hit,
  stand,
  settleBlackjack,
  calcHand
} from "../../utils/gamble/blackjackCore.js";

export default {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("ブラックジャックをプレイします")
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

    const game = startBlackjack({ guildId, userId, bet });
    if (game.error) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor("Red").setDescription(game.error)],
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#2ecc71")
      .setTitle("🃏 ブラックジャック")
      .addFields(
        { name: "あなた", value: `${game.playerHand.join(", ")} (計 ${calcHand(game.playerHand)})` },
        { name: "ディーラー", value: `${game.dealerHand[0]}, ?` }
      )
      .setFooter({ text: "ヒット / スタンドは後でボタン対応予定" });

    return interaction.reply({ embeds: [embed] });
  }
};
