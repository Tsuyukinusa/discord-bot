import { EmbedBuilder } from "discord.js";

export function createPokerEmbed({ hand, bet, result, payout }) {
  return new EmbedBuilder()
    .setTitle("🃏 ポーカー")
    .setColor(result.rate > 0 ? "#f1c40f" : "#7f8c8d")
    .setDescription(hand.map(c => c.display).join(" "))
    .addFields(
      { name: "賭け金", value: `${bet}`, inline: true },
      { name: "役", value: result.name, inline: true },
      { name: "配当", value: payout > 0 ? `${payout}` : "0", inline: true }
    );
}
