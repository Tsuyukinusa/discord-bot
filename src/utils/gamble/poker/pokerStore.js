// utils/gamble/pokerStore.js
const pokerGames = new Map(); // key: guildId-userId

export function savePokerGame(key, game) {
  pokerGames.set(key, game);
}

export function getPokerGame(key) {
  return pokerGames.get(key);
}

export function endPokerGame(key) {
  pokerGames.delete(key);
}
