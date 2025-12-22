// utils/gamble/blackjackEmbed.js
import { EmbedBuilder } from "discord.js";
import { handToString, handValue } from "./blackjackCore.js";

export function createBlackjackEmbed(state, revealDealer = false) {
  const dealerHand = revealDealer
    ? `${handToString(state.dealer)} (${handValue(state.dealer)})`
    : `${state.dealer[0]}, ?`;

  return new EmbedBuilder()
    .setColor("#2ecc71")
    .setTitle("🃏 ブラックジャック")
    .addFields(
      {
        name: "🧑 プレイヤー",
        value: `${handToString(state.player)} (${handValue(state.player)})`
      },
      {
        name: "🤖 ディーラー",
        value: dealerHand
      }
    );
}
