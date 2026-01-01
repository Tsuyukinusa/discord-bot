import {
  canAfford,
  subtractBalance,
  addBalance
} from "../../../Services/economyServices.js";
import { createDeck, shuffle } from "./pokerDeck.js";
import { judgePoker } from "./pokerLogic.js";
import { getPokerGame, savePokerGame, endPokerGame } from "./pokerStore.js";

export async function startPoker({ guildId, userId, bet }) {
  if (!(await canAfford(guildId, userId, bet))) {
    return { error: "所持金が足りません" };
  }

  await subtractBalance(guildId, userId, bet);

  const deck = shuffle(createDeck());
  const hand = deck.splice(0, 5);

  const game = { guildId, userId, bet, deck, hand, exchanged: false };
  savePokerGame(guildId, userId, game);
  return game;
}

export async function finalizePoker(guildId, userId) {
  const game = getPokerGame(guildId, userId);
  if (!game) return { error: "ゲームが存在しません" };

  const result = judgePoker(game.hand);
  const payout = Math.floor(game.bet * result.rate);

  if (payout > 0) {
    await addBalance(guildId, userId, payout);
  }

  endPokerGame(guildId, userId);
  return { ...game, result, payout };
}
