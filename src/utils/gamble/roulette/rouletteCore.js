import { readGuildDB, writeGuildDB } from "../utils/core/file.js";
import { resolveRoulette } from "./rouletteLogic.js";

const roulettes = new Map(); // guildId => roulette

/* ======================
   ルーレット開始 or 参加
====================== */
export async function joinRoulette({ guildId, userId, bet }) {
  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];

  if (!user) return { error: "ユーザー情報がありません" };

  // 金額解釈
  let amount = bet.amount;
  if (amount === "half") amount = Math.floor(user.balance / 2);
  if (amount === "all") amount = user.balance;

  if (amount <= 0 || user.balance < amount) {
    return { error: "所持金が足りません" };
  }

  let roulette = roulettes.get(guildId);

  // 初回
  if (!roulette) {
    roulette = {
      bets: [],
      open: true,
      endAt: Date.now() + 30_000
    };
    roulettes.set(guildId, roulette);

    // 自動締切
    setTimeout(() => closeRoulette(guildId), 30_000);
  }

  if (!roulette.open) {
    return { error: "このルーレットは締め切られました" };
  }

  // 支払い
  user.money -= amount;
  roulette.bets.push({
    userId,
    type: bet.type,
    value: bet.value,
    amount
  });

  await writeGuildDB(db);

  return roulette;
}

/* ======================
   締切 & 結果
====================== */
export async function closeRoulette(guildId) {
  const roulette = roulettes.get(guildId);
  if (!roulette || !roulette.open) return null;

  roulette.open = false;

  const result = resolveRoulette({ bets: roulette.bets });

  const db = await readGuildDB();

  // 配当
  for (const d of result.details) {
    if (d.win) {
      db[guildId].users[d.userId].money += d.payout;
    }
  }

  await writeGuildDB(db);
  roulettes.delete(guildId);

  return result;
}

export function getRoulette(guildId) {
  return roulettes.get(guildId);
}
