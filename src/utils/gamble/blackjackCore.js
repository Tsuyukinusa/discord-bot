// utils/blackjackCore.js
import { getGame, saveGame, endGame } from "./blackjackStore.js";
import { drawCard, calcHand, judge } from "./blackjackLogic.js";

// --- HIT ---
export function playHit(guildId, userId) {
  const game = getGame(guildId, userId);
  if (!game) return { error: "ゲームが存在しません" };
  if (game.finished) return { error: "このゲームは終了しています" };

  game.hands[game.currentHand].push(drawCard());

  const total = calcHand(game.hands[game.currentHand]);
  if (total > 21) {
    game.finished = true;
    game.result = "lose";
    endGame(guildId, userId);
  }

  saveGame(guildId, userId, game);
  return game;
}

// --- STAND ---
export function playStand(guildId, userId) {
  const game = getGame(guildId, userId);
  if (!game) return { error: "ゲームが存在しません" };
  if (game.finished) return { error: "このゲームは終了しています" };

  while (calcHand(game.dealer) < 17) {
    game.dealer.push(drawCard());
  }

  game.finished = true;
  game.result = judge(game);
  endGame(guildId, userId);

  return game;
}
