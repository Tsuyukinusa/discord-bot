// utils/blackjackEmbed.js
import { EmbedBuilder } from "discord.js";
import { calcHand } from "./blackjackLogic.js";

function renderHand(cards) {
  return cards.map(c => `${c.rank}${c.suit}`).join(" ");
}

export function createBlackjackEmbed(game) {
  const embed = new EmbedBuilder()
    .setColor("#2ecc71")
    .setTitle("🃏 Blackjack")
    .setFooter({ text: `Bet: ${game.bet}` });

  // ---- プレイヤー手札 ----
  game.hands.forEach((hand, index) => {
    const total = calcHand(hand);
    const active = game.currentHand === index && !game.finished;

    embed.addFields({
      name: `あなたの手札 ${game.split ? `(Hand ${index + 1})` : ""}${active ? " ←" : ""}`,
      value: `${renderHand(hand)}\n**合計: ${total}**`,
      inline: false
    });
  });

  // ---- ディーラー ----
  if (game.finished) {
    embed.addFields({
      name: "ディーラー",
      value: `${renderHand(game.dealer)}\n**合計: ${calcHand(game.dealer)}**`,
      inline: false
    });
  } else {
    embed.addFields({
      name: "ディーラー",
      value: `${game.dealer[0].rank}${game.dealer[0].suit} ❓`,
      inline: false
    });
  }

  // ---- 結果 ----
  if (game.finished) {
    const resultText = {
      win: "🎉 勝ち！",
      lose: "💀 負け…",
      push: "🤝 引き分け"
    };

    embed.addFields({
      name: "結果",
      value: resultText[game.result] || "―",
      inline: false
    });
  }

  return embed;
}
