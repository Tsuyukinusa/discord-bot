// utils/gamble/crashCore.js
import { readGuildDB, writeGuildDB } from "../file.js";

const crashes = new Map(); // guildId:userId => game

function getKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

function generateCrashPoint() {
  // よくあるCrash式（低倍率が多くなる）
  const r = Math.random();
  return Math.max(1.01, Math.floor((1 / r) * 100) / 100);
}

/* ======================
   開始
====================== */
export async function startCrash({ guildId, userId, bet }) {
  const key = getKey(guildId, userId);
  if (crashes.has(key)) {
    return { error: "すでにクラッシュが進行中です" };
  }

  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];
  if (!user || user.money < bet) {
    return { error: "所持金が足りません" };
  }

  user.money -= bet;
  await writeGuildDB(db);

  const game = {
    bet,
    multiplier: 1.0,
    crashPoint: generateCrashPoint(),
    started: Date.now(),
    finished: false
  };

  crashes.set(key, game);
  return game;
}

/* ======================
   進行（倍率UP）
====================== */
export function tickCrash(guildId, userId) {
  const key = getKey(guildId, userId);
  const game = crashes.get(key);
  if (!game || game.finished) return null;

  game.multiplier = Math.round((game.multiplier + 0.01) * 100) / 100;

  if (game.multiplier >= game.crashPoint) {
    game.finished = true;
    game.crashed = true;
    crashes.delete(key);
    return { crashed: true, game };
  }

  return { crashed: false, game };
}

/* ======================
   キャッシュアウト
====================== */
export async function cashOut(guildId, userId) {
  const key = getKey(guildId, userId);
  const game = crashes.get(key);
  if (!game || game.finished) {
    return { error: "すでに終了しています" };
  }

  game.finished = true;
  crashes.delete(key);

  const win = Math.floor(game.bet * game.multiplier);

  const db = await readGuildDB();
  db[guildId].users[userId].money += win;
  await writeGuildDB(db);

  return {
    win,
    multiplier: game.multiplier
  };
}
