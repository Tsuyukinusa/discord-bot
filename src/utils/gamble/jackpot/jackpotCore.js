import { readGuildDB, writeGuildDB } from "../utils/core/file.js";

const jackpots = new Map(); 
// guildId => { hostId, entry, players, pot, open, timeoutId }

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
    open: true,
    timeoutId: null
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

  if (jackpot.players.some(p => p.userId === userId)) {
    return { error: "すでに参加しています" };
  }

  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];

  if (!user || user.money < jackpot.entry) {
    return { error: "所持金が足りません" };
  }

  // お金を引く
  user.money -= jackpot.entry;
  jackpot.players.push({ userId });
  jackpot.pot += jackpot.entry;

  await writeGuildDB(db);

  // ★ 参加者が3人以上 & タイマー未設定なら自動締切開始
  if (jackpot.players.length >= 3 && !jackpot.timeoutId) {
    startRandomCloseTimer(guildId);
  }

  return jackpot;
}

/* ======================
   ランダム締切タイマー
====================== */
function startRandomCloseTimer(guildId) {
  const jackpot = jackpots.get(guildId);
  if (!jackpot) return;

  const delay =
    Math.floor(Math.random() * (120 - 30 + 1) + 30) * 1000;

  jackpot.timeoutId = setTimeout(() => {
    closeJackpot(guildId);
  }, delay);

  console.log(
    `[Jackpot] ${guildId} will close in ${delay / 1000}s`
  );
}

/* ======================
   締切 & 抽選
====================== */
export async function closeJackpot(guildId) {
  const jackpot = jackpots.get(guildId);
  if (!jackpot || !jackpot.open) return null;

  jackpot.open = false;

  // タイマー解除
  if (jackpot.timeoutId) {
    clearTimeout(jackpot.timeoutId);
    jackpot.timeoutId = null;
  }

  if (jackpot.players.length === 0) {
    jackpots.delete(guildId);
    return { canceled: true };
  }

  const winner =
    jackpot.players[
      Math.floor(Math.random() * jackpot.players.length)
    ];

  const db = await readGuildDB();
  db[guildId].users[winner.userId].money += jackpot.pot;
  await writeGuildDB(db);

  jackpots.delete(guildId);

  return {
    winnerId: winner.userId,
    pot: jackpot.pot
  };
}

/* ======================
   取得
====================== */
export function getJackpot(guildId) {
  return jackpots.get(guildId);
}
