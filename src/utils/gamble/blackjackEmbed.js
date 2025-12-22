import { EmbedBuilder } from "discord.js";
import { calcHand } from "./blackjackLogic.js";

function formatHand(hand) {
  return `${hand.map(c => c.label).join(" ")}  (${calcHand(hand)})`;
}

export function createBlackjackEmbed(game) {
  const playerHand = game.hands[game.currentHand];
  const dealerHand = game.finished
    ? formatHand(game.dealer)
    : `${game.dealer[0].label} ❓`;

  const embed = new EmbedBuilder()
    .setColor(game.finished ? "#ffcc00" : "#00c3ff")
    .setTitle("🃏 Blackjack")
    .addFields(
      { name: "あなた", value: formatHand(playerHand), inline: false },
      { name: "ディーラー", value: dealerHand, inline: false },
      { name: "BET", value: `${game.bet}`, inline: true }
    );

  if (game.finished) {
    const resultText = {
      win: "🎉 勝ち！",
      lose: "💥 負け…",
      push: "🤝 引き分け"
    }[game.result];

    embed.addFields({ name: "結果", value: resultText });
  }

  return embed;
}
