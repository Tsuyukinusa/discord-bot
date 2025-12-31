// utils/gamble/pokerCore.js
import { createDeck, shuffle } from "./pokerDeck.js";
import { judgePoker } from "./pokerLogic.js";
import { readGuildDB, writeGuildDB } from "../utils/core/file.js";
import { getPokerGame, savePokerGame, endPokerGame } from "./pokerStore.js";

/* ======================
   ゲーム開始
====================== */
export async function startPoker({ guildId, userId, bet }) {
  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];

  if (!user || user.balance < bet) {
    return { error: "所持金が足りません" };
  }

  user.balance -= bet;

  const deck = shuffle(createDeck());
  const hand = deck.splice(0, 5);

  const game = {
    guildId,
    userId,
    bet,
    deck,
    hand,
    exchanged: false,
    finished: false
  };

  savePokerGame(guildId, userId, game);
  await writeGuildDB(db);

  return game;
}

/* ======================
   カード交換
====================== */
export function exchangeCards(game, indexes) {
  if (game.exchanged) {
    return { error: "すでに交換しています" };
  }

  for (const i of indexes) {
    game.hand[i] = game.deck.pop();
  }

  game.exchanged = true;
  return game;
}

/* ======================
   確定 & 精算
====================== */
export async function finalizePoker(guildId, userId) {
  const game = getPokerGame(guildId, userId);
  if (!game) return { error: "ゲームが存在しません" };

  const result = judgePoker(game.hand);
  const payout = Math.floor(game.bet * result.rate);

  const db = await readGuildDB();
  const user = db[guildId].users[userId];

  if (payout > 0) {
    user.money += payout;
  }

  game.finished = true;
  game.result = result;
  game.payout = payout;

  await writeGuildDB(db);
  endPokerGame(guildId, userId);

  return game;
}
