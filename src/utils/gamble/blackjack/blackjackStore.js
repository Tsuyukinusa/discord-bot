// src/Stores/BlackjackStore.js

const blackjackGames = new Map();
export { startBlackjack } from "blackjackCode.js";
/**
 * ゲーム作成
 */
export function createGame(guildId, userId, bet, deck) {
  if (!blackjackGames.has(guildId)) {
    blackjackGames.set(guildId, new Map());
  }

  blackjackGames.get(guildId).set(userId, {
    bet,
    playerHand: [],
    dealerHand: [],
    deck,
    finished: false
  });
}

/**
 * ゲーム取得
 */
export function getGame(guildId, userId) {
  return blackjackGames.get(guildId)?.get(userId) ?? null;
}

/**
 * 手札にカード追加
 */
export function addCard(guildId, userId, target, card) {
  const game = getGame(guildId, userId);
  if (!game || game.finished) return;

  if (target === "player") {
    game.playerHand.push(card);
  } else if (target === "dealer") {
    game.dealerHand.push(card);
  }
}

/**
 * デッキから1枚引く
 */
export function drawCard(guildId, userId) {
  const game = getGame(guildId, userId);
  if (!game || game.deck.length === 0) return null;

  return game.deck.pop();
}

/**
 * ゲーム終了
 */
export function finishGame(guildId, userId) {
  const game = getGame(guildId, userId);
  if (game) game.finished = true;
}

/**
 * ゲーム削除（終了後）
 */
export function deleteGame(guildId, userId) {
  blackjackGames.get(guildId)?.delete(userId);
}

/**
 * ゲーム存在チェック
 */
export function hasGame(guildId, userId) {
  return blackjackGames.get(guildId)?.has(userId) ?? false;
}
