// utils/gamble/crashCore.js
import { readGuildDB, writeGuildDB } from "../file.js";

const crashes = new Map(); // guildId => crashGame

/* ======================
   クラッシュ開始
====================== */
export function startCrash(guildId) {
  if (crashes.has(guildId)) {
    return { error: "すでにクラッシュが進行中です" };
  }

  const crashPoint = Math.max(1.01, Number((1 / Math.random()).toFixed(2)));

  const game = {
    open: true,
    crashed: false,
    multiplier: 1.0,
    crashPoint,
    players: []
  };

  crashes.set(guildId, game);
  return game;
}

/* ======================
   参加
====================== */
export async function joinCrash({ guildId, userId, bet }) {
  const game = crashes.get(guildId);
  if (!game || !game.open) {
    return { error: "クラッシュは開始されていません" };
  }

  if (game.players.find(p => p.userId === userId)) {
    return { error: "すでに参加しています" };
  }

  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];

  if (!user || user.money < bet) {
    return { error: "所持金が足りません" };
  }

  user.money -= bet;
  await writeGuildDB(db);

  game.players.push({
    userId,
    bet,
    cashedOut: false,
    cashoutAt: null
  });

  return game;
}

/* ======================
   キャッシュアウト
====================== */
export async function cashoutCrash({ guildId, userId }) {
  const game = crashes.get(guildId);
  if (!game || game.crashed) {
    return { error: "すでにクラッシュしています" };
  }

  const player = game.players.find(p => p.userId === userId);
  if (!player || player.cashedOut) {
    return { error: "キャッシュアウトできません" };
  }

  player.cashedOut = true;
  player.cashoutAt = game.multiplier;

  const win = Math.floor(player.bet * game.multiplier);

  const db = await readGuildDB();
  db[guildId].users[userId].money += win;
  await writeGuildDB(db);

  return { multiplier: game.multiplier, win };
}

/* ======================
   倍率更新（ループ用）
====================== */
export function tickCrash(guildId) {
  const game = crashes.get(guildId);
  if (!game || game.crashed) return null;

  game.multiplier = Number((game.multiplier + 0.01).toFixed(2));

  if (game.multiplier >= game.crashPoint) {
    game.crashed = true;
    game.open = false;
    return { crashed: true, crashPoint: game.crashPoint };
  }

  return { crashed: false, multiplier: game.multiplier };
}

/* ======================
   取得
====================== */
export function getCrash(guildId) {
  return crashes.get(guildId);
}

/* ======================
   終了
====================== */
export function endCrash(guildId) {
  crashes.delete(guildId);
}
