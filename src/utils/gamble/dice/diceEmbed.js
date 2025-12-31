// utils/gamble/diceEmbed.js
import { EmbedBuilder } from "discord.js";

export function createDiceEmbed(result) {
  const diceText = result.dice.map(d => `🎲${d}`).join(" ");

  const embed = new EmbedBuilder()
    .setColor(result.win ? "#2ecc71" : "#e74c3c")
    .setTitle("🎲 ダイス")
    .addFields(
      { name: "出目", value: diceText, inline: false },
      { name: "合計", value: `${result.sum}`, inline: true },
      { name: "結果", value: result.win ? "🎉 勝ち" : "💀 負け", inline: true },
      {
        name: "配当",
        value: result.win
          ? `+${result.payout}（${result.rate}倍）`
          : "0",
        inline: false
      }
    );

  return embed;
}
