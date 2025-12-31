import { EmbedBuilder } from "discord.js";

/* ======================
   受付中Embed
====================== */
export function createRouletteWaitingEmbed({
  bets,
  remainingSeconds
}) {
  return new EmbedBuilder()
    .setTitle("🎡 ルーレット")
    .setDescription(
      bets.length === 0
        ? "まだ誰も賭けていません"
        : bets.map(b =>
            `• <@${b.userId}> ： **${b.type}** ${b.value ?? ""}（${b.amount}）`
          ).join("\n")
    )
    .setColor("#3498db")
    .setFooter({
      text: `⏳ 残り ${remainingSeconds} 秒`
    });
}

/* ======================
   結果Embed
====================== */
export function createRouletteResultEmbed({
  result,
  color,
  details
}) {
  const winners = details.filter(d => d.win);

  return new EmbedBuilder()
    .setTitle("🎡 ルーレット結果")
    .setColor(
      color === "red" ? "Red" :
      color === "black" ? "Black" :
      "Green"
    )
    .setDescription(`🎯 **${result} 番 (${color})** でした！`)
    .addFields(
      {
        name: "🎉 勝者",
        value:
          winners.length === 0
            ? "なし…"
            : winners
                .map(w => `<@${w.userId}>（+${w.payout}）`)
                .join("\n")
      }
    )
    .setFooter({ text: "ルーレット終了" });
}
