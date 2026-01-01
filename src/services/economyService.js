import {
  canAfford,
  subtractBalance,
  addBalance
} from "../../Services/economyServices.js";

const crashes = new Map();

function key(g, u) {
  return `${g}:${u}`;
}

function generateCrashPoint() {
  const r = Math.random();
  return Math.max(1.01, Math.floor((1 / r) * 100) / 100);
}

export async function startCrash({ guildId, userId, bet }) {
  const k = key(guildId, userId);
  if (crashes.has(k)) return { error: "進行中です" };

  if (!(await canAfford(guildId, userId, bet))) {
    return { error: "所持金が足りません" };
  }

  await subtractBalance(guildId, userId, bet);

  const game = {
    bet,
    multiplier: 1.0,
    crashPoint: generateCrashPoint(),
    finished: false
  };

  crashes.set(k, game);
  return game;
}

export function tickCrash(guildId, userId) {
  const game = crashes.get(key(guildId, userId));
  if (!game || game.finished) return null;

  game.multiplier = +(game.multiplier + 0.01).toFixed(2);

  if (game.multiplier >= game.crashPoint) {
    game.finished = true;
    crashes.delete(key(guildId, userId));
    return { crashed: true, game };
  }

  return { crashed: false, game };
}

export async function cashOut(guildId, userId) {
  const k = key(guildId, userId);
  const game = crashes.get(k);
  if (!game || game.finished) return { error: "終了済み" };

  game.finished = true;
  crashes.delete(k);

  const win = Math.floor(game.bet * game.multiplier);
  await addBalance(guildId, userId, win);

  return { win, multiplier: game.multiplier };
}
