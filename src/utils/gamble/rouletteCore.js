import { readGuildDB, writeGuildDB } from "../file.js";
import { resolveRoulette } from "./rouletteLogic.js";

const roulettes = new Map(); // guildId => roulette

/* ======================
   ルーレット開始
====================== */
export function startRoulette({ guildId }) {
  if (roulettes.has(guildId)) {
    return { error: "すでにルーレットが進行中です" };
  }

  const roulette = {
    open: true,
    bets: [],
    timer: null
  };

  // 30秒後に自動締切
  roulette.timer = setTimeout(() => {
    closeRoulette(guildId);
  }, 30_000);

  roulettes.set(guildId, roulette);
  return roulette;
}

/* ======================
   ベット追加
====================== */
export async function placeBet({
  guildId,
  userId,
  type,
  value,
  amount,
  mode // normal | half | all
}) {
  const roulette = roulettes.get(guildId);
  if (!roulette || !roulette.open) {
    return { error: "ルーレットは受付中ではありません" };
  }

  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];

  if (!user) return { error: "ユーザー情報がありません" };

  let betAmount = amount;

  if (mode === "half") {
    betAmount = Math.floor(user.money / 2);
  }

  if (mode === "all") {
    betAmount = user.money;
  }

  if (betAmount <= 0) {
    return { error: "賭け金が不足しています" };
  }

  if (user.money < betAmount) {
    return { error: "所持金が足りません" };
  }

  // 即引き
  user.money -= betAmount;

  roulette.bets.push({
    userId,
    type,
    value,
    amount: betAmount
  });

  await writeGuildDB(db);

  return {
    success: true,
    betAmount
  };
}

/* ======================
   締切 & 結果処理
====================== */
export async function closeRoulette(guildId) {
  const roulette = roulettes.get(guildId);
  if (!roulette) return null;

  roulette.open = false;
  clearTimeout(roulette.timer);

  if (roulette.bets.length === 0) {
    roulettes.delete(guildId);
    return { canceled: true };
  }

  const result = resolveRoulette({ bets: roulette.bets });

  const db = await readGuildDB();

  for (const bet of result.details) {
    if (bet.win) {
      db[guildId].users[bet.userId].money += bet.payout;
    }
  }

  await writeGuildDB(db);
  roulettes.delete(guildId);

  return result;
}

/* ======================
   状態取得
====================== */
export function getRoulette(guildId) {
  return roulettes.get(guildId);
                                  }
