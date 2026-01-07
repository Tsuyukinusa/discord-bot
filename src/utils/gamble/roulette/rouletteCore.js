import {
  canAfford,
  subtractBalance,
  addBalance
} from "../../../Services/economyServices.js";
import { resolveRoulette } from "./rouletteLogic.js";

const roulettes = new Map();

export async function joinRoulette({ guildId, userId, bet }) {
  let amount = bet.amount;

  if (amount === "half") {
    // 呼び出し側で計算する設計でもOK
    return { error: "half/all は上位で解釈してね" };
  }

  if (!(await canAfford(guildId, userId, amount))) {
    return { error: "所持金が足りません" };
  }

  let roulette = roulettes.get(guildId);
  if (!roulette) {
    roulette = { bets: [], open: true };
    roulettes.set(guildId, roulette);
    setTimeout(() => closeRoulette(guildId), 30_000);
  }

  await subtractBalance(guildId, userId, amount);

  roulette.bets.push({
    userId,
    type: bet.type,
    value: bet.value,
    amount
  });

  return roulette;
}

export async function closeRoulette(guildId) {
  const roulette = roulettes.get(guildId);
  if (!roulette) return null;

  const result = resolveRoulette({ bets: roulette.bets });

  for (const d of result.details) {
    if (d.win) {
      await addBalance(guildId, d.userId, d.payout);
    }
  }

  roulettes.delete(guildId);
  return result;
}

export function getRoulette(guildId) {
  return roulettes.get(guildId) ?? null;
}
