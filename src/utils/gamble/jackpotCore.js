import { readGuildDB, writeGuildDB } from "../file.js";

const jackpots = new Map(); // guildId => jackpot

/* ======================
   ジャックポット開始
====================== */
export function startJackpot({ guildId, hostId, entry }) {
  if (jackpots.has(guildId)) {
    return { error: "すでにジャックポットが開催中です" };
  }

  const jackpot = {
    hostId,
    entry,
    players: [],
    pot: 0,
    open: true
  };

  jackpots.set(guildId, jackpot);
  return jackpot;
}

/* ======================
   参加
====================== */
export async function joinJackpot({ guildId, userId }) {
  const jackpot = jackpots.get(guildId);
  if (!jackpot || !jackpot.open) {
    return { error: "ジャックポットは開催されていません" };
  }

  if (jackpot.players.find(p => p.userId === userId)) {
    return { error: "すでに参加しています" };
  }

  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];

  if (!user || user.money < jackpot.entry) {
    return { error: "所持金が足りません" };
  }

  user.money -= jackpot.entry;
  jackpot.players.push({ userId });
  jackpot.pot += jackpot.entry;

  await writeGuildDB(db);
  return jackpot;
}

/* ======================
   締切 & 抽選
====================== */
export async function closeJackpot(guildId) {
  const jackpot = jackpots.get(guildId);
  if (!jackpot) return null;

  jackpot.open = false;

  if (jackpot.players.length === 0) {
    jackpots.delete(guildId);
    return { canceled: true };
  }

  const winner =
    jackpot.players[Math.floor(Math.random() * jackpot.players.length)];

  const db = await readGuildDB();
  db[guildId].users[winner.userId].money += jackpot.pot;
  await writeGuildDB(db);

  jackpots.delete(guildId);

  return {
    winnerId: winner.userId,
    pot: jackpot.pot
  };
}

export function getJackpot(guildId) {
  return jackpots.get(guildId);
}
