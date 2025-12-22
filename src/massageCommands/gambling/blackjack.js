import { EmbedBuilder } from "discord.js";
import {
  startBlackjack,
  hit,
  stand,
  settleBlackjack,
  calcHand
} from "../../utils/gamble/blackjackCore.js";

export default async function blackjackMessage(message, args) {
  const bet = parseInt(args[0]);
  if (!bet || bet <= 0) {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setDescription("❌ 賭け金を正しく指定してください\n例: `!bj 100`")
      ]
    });
  }

  const guildId = message.guild.id;
  const userId = message.author.id;

  let game = startBlackjack({ guildId, userId, bet });
  if (game.error) {
    return message.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(game.error)]
    });
  }

  const embed = new EmbedBuilder()
    .setColor("#3498db")
    .setTitle("🃏 ブラックジャック")
    .setDescription(
      `**あなた:** ${game.playerHand.join(", ")} (計 ${calcHand(game.playerHand)})\n` +
      `**ディーラー:** ${game.dealerHand[0]}, ?`
    )
    .setFooter({ text: "!hit / !stand（後で実装）" });

  message.reply({ embeds: [embed] });
}
