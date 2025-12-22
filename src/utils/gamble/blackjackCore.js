// utils/blackjackCore.js
import { getGame, saveGame, endGame } from "./blackjackStore.js";

export function playHit(guildId, userId) {
  const game = getGame(guildId, userId);
  if (!game) return { error: "ゲームが存在しません" };

  game.player.push(drawCard());

  if (calcHand(game.player) > 21) {
    game.finished = true;
    game.result = "lose";
    endGame(guildId, userId);
  }

  saveGame(guildId, userId, game);
  return game;
}

export function playStand(guildId, userId) {
  const game = getGame(guildId, userId);
  if (!game) return { error: "ゲームが存在しません" };

  // ディーラーは17以上で停止
  while (calcHand(game.dealer) < 17) {
    game.dealer.push(drawCard());
  }

  game.finished = true;
  game.result = judge(game);
  endGame(guildId, userId);

  return game;
}
