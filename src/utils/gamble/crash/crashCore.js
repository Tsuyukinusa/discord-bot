import {
  canAfford,
  subtractBalance,
  addBalance
} from "../../../Services/economyServices.js";

const crashes = new Map();

export async function startCrash({ guildId, userId, bet }) {
  if (!(await canAfford(guildId, userId, bet))) {
    return { error: "お金が足りません" };
  }

  await subtractBalance(guildId, userId, bet);

  const game = {
    bet,
    multiplier: 1.0,
    crashPoint: Math.max(1.01, Math.floor((1 / Math.random()) * 100) / 100)
  };

  crashes.set(`${guildId}:${userId}`, game);
  return game;
}

export async function cashOut(guildId, userId) {
  const key = `${guildId}:${userId}`;
  const game = crashes.get(key);
  if (!game) return null;

  const win = Math.floor(game.bet * game.multiplier);
  await addBalance(guildId, userId, win);
  crashes.delete(key);

  return { win, multiplier: game.multiplier };
}
export {cashOut as tickCrash}
