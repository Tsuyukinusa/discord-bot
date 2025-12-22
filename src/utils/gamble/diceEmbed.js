// utils/gamble/diceEmbed.js
import { EmbedBuilder } from "discord.js";

export function createDiceEmbed(result) {
  const embed = new EmbedBuilder()
    .setTitle("🎲 ダイス")
    .setColor(result.win ? "#2ecc71" : "#e74c3c")
    .addFields(
      { name: "出目", value: result.dice.join(" 🎲 "), inline: false },
      { name: "合計", value: `${result.sum}`, inline: true },
      { name: "結果", value: result.win ? "🎉 勝ち" : "💀 負け", inline: true }
    )
    .setFooter({
      text: result.win
        ? `配当: ${result.payout} (${result.rate}倍)`
        : "残念！"
    });

  return embed;
}
