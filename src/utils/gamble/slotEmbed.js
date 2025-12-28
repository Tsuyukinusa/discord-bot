import { EmbedBuilder } from "discord.js";

export function createSlotEmbed(result, bet) {
  const {
    reels,
    win,
    type,
    emoji,
    rate,
    payout
  } = result;

  const embed = new EmbedBuilder()
    .setTitle("🎰 スロット")
    .setDescription(`┃ ${reels.join(" ┃ ")} ┃`)
    .setFooter({ text: `賭け金: ${bet}` });

  if (!win) {
    embed
      .setColor("Red")
      .addFields({
        name: "結果",
        value: "❌ ハズレ…"
      });
    return embed;
  }

  // 勝ちの場合
  let resultText = "";
  if (type === "triple") {
    resultText = `🎉 **3つ揃い！** ${emoji}`;
  } else if (type === "pair") {
    resultText = `✨ **2つ揃い！** ${emoji}`;
  }

  embed
    .setColor("Gold")
    .addFields(
      {
        name: "結果",
        value: resultText
      },
      {
        name: "配当",
        value: `倍率: **${rate}倍**\n獲得: **${payout}**`
      }
    );

  return embed;
}
