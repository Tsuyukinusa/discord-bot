import {
  canAfford,
  subtractBalance,
  addBalance
} from "../../../Services/economyServices.js";
import { getGame, saveGame, endGame } from "./blackjackStore.js";
import { drawCard, calcHand } from "./blackjackLogic.js";

export async function startBlackjack({ guildId, userId, bet }) {
  if (!(await canAfford(guildId, userId, bet))) {
    return { error: "お金が足りません" };
  }

  await subtractBalance(guildId, userId, bet);

  const game = {
    userId,
    bet,
    hands: [[drawCard(), drawCard()]],
    dealer: [drawCard(), drawCard()],
    finished: false
  };

  saveGame(guildId, userId, game);
  return game;
}

export async function standBlackjack(guildId, userId) {
  const game = getGame(guildId, userId);
  if (!game) return { error: "ゲームがありません" };

  while (calcHand(game.dealer) < 17) {
    game.dealer.push(drawCard());
  }

  const player = calcHand(game.hands[0]);
  const dealer = calcHand(game.dealer);

  let result = "lose";
  if (player <= 21 && (dealer > 21 || player > dealer)) result = "win";
  if (player === dealer) result = "push";

  if (result === "win") await addBalance(guildId, userId, game.bet * 2);
  if (result === "push") await addBalance(guildId, userId, game.bet);

  endGame(guildId, userId);
  return { result };
}
