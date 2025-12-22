import { EmbedBuilder } from "discord.js";
import { calcHand } from "./blackjackLogic.js";

function formatHand(hand) {
  return hand.map(c => c.display).join(" ");
}

export function createBlackjackEmbed(game) {
  const embed = new EmbedBuilder()
    .setColor("#2ecc71")
    .setTitle("🃏 ブラックジャック");

  game.hands.forEach((hand, i) => {
    embed.addFields({
      name: `あなたの手札 ${game.split ? `(Hand ${i + 1})` : ""}`,
      value: `${formatHand(hand)}\n合計: **${calcHand(hand)}**`,
      inline: false
    });
  });

  embed.addFields({
    name: "ディーラー",
    value: `${formatHand(game.dealer)}\n合計: **${calcHand(game.dealer)}**`
  });

  if (game.finished) {
    const text =
      game.result === "win" ? "🎉 勝ち！" :
      game.result === "lose" ? "💀 負け…" :
      "🤝 引き分け";

    embed.setFooter({ text });
  } else if (game.split) {
    embed.setFooter({ text: `操作中のハンド: ${game.currentHand + 1}` });
  }

  return embed;
}
