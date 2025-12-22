// utils/blackjackCore.js
import { getGame, saveGame, endGame } from "./blackjackStore.js";
import { drawCard, calcHand, judge } from "./blackjackLogic.js";

/**
 * 共通：操作ユーザー検証
 */
function validateGame(guildId, userId) {
  const game = getGame(guildId, userId);

  if (!game) {
    return { error: "ゲームが存在しません。" };
  }

  // 🔒 ゲーム作成者チェック
  if (game.owner !== userId) {
    return { error: "このブラックジャックはあなたのゲームではありません。" };
  }

  if (game.finished) {
    return { error: "このゲームはすでに終了しています。" };
  }

  return { game };
}

// ---------- HIT ----------
export function playHit(guildId, userId) {
  const check = validateGame(guildId, userId);
  if (check.error) return { error: check.error };

  const game = check.game;

  game.hands[game.currentHand].push(drawCard());

  const total = calcHand(game.hands[game.currentHand]);
  if (total > 21) {
    game.finished = true;
    game.result = "lose";
    endGame(guildId, userId);
  } else {
    saveGame(guildId, userId, game);
  }

  return game;
}

// ---------- STAND ----------
export function playStand(guildId, userId) {
  const check = validateGame(guildId, userId);
  if (check.error) return { error: check.error };

  const game = check.game;

  // ディーラーは17以上で停止
  while (calcHand(game.dealer) < 17) {
    game.dealer.push(drawCard());
  }

  game.finished = true;
  game.result = judge(game);
  endGame(guildId, userId);

  return game;
}
