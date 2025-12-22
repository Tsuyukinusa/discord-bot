// utils/gamble/DiceEmbed.js
import { EmbedBuilder } from "discord.js";

/* ======================
   ダイス埋め込み
====================== */
export function createDiceEmbed({
  dice,
  sum,
  win,
  rate,
  bet,
  payout,
  afterMoney
}) {
  const embed = new EmbedBuilder()
    .setTitle("🎲 ダイス")
    .setColor(win ? "#2ecc71" : "#e74c3c")
    .addFields(
      {
        name: "🎯 出目",
        value: dice.join(" ・ "),
        inline: false
      },
      {
        name: "➕ 合計",
        value: `${sum}`,
        inline: true
      },
      {
        name: "💰 賭け金",
        value: `${bet.toLocaleString()}`,
        inline: true
      },
      {
        name: "📈 配当倍率",
        value: `${rate}倍`,
        inline: true
      }
    );

  if (win) {
    embed.addFields({
      name: "🎉 勝利！",
      value: `払い戻し: **${payout.toLocaleString()}**`
    });
  } else {
    embed.addFields({
      name: "💀 負け",
      value: "賭け金は失われました"
    });
  }

  embed.setFooter({
    text: `現在の所持金: ${afterMoney.toLocaleString()}`
  });

  return embed;
}
