import {
  canAfford,
  subtractBalance,
  addBalance
} from "../../../Services/economyServices.js";

const jackpots = new Map();

export async function joinJackpot({ guildId, userId }) {
  const jackpot = jackpots.get(guildId);
  if (!jackpot) return { error: "開催されていません" };

  if (!(await canAfford(guildId, userId, jackpot.entry))) {
    return { error: "所持金が足りません" };
  }

  await subtractBalance(guildId, userId, jackpot.entry);
  jackpot.players.push({ userId });
  jackpot.pot += jackpot.entry;

  return jackpot;
}

export async function closeJackpot(guildId) {
  const jackpot = jackpots.get(guildId);
  if (!jackpot) return null;

  const winner =
    jackpot.players[Math.floor(Math.random() * jackpot.players.length)];

  await addBalance(guildId, winner.userId, jackpot.pot);
  jackpots.delete(guildId);

  return { winnerId: winner.userId, pot: jackpot.pot };
}
export function startJackpot({ guildId, hostId, entry }) {
  if (jackpots.has(guildId)) {
    return { error: "すでにジャックポットが開催中です" };
  }

  const jackpot = {
    guildId,
    hostId,
    entry,
    players: [{ userId: hostId }],
    pot: entry,
    startedAt: Date.now(),
    finished: false
  };

  jackpots.set(guildId, jackpot);
  return jackpot;
}

export function getJackpot(guildId) {
  return jackpots.get(guildId) ?? null;
}
