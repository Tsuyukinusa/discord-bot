import {
  canAfford,
  subtractBalance,
  addBalance,
  getBalance
} from "../../../Services/economyServices.js";

export async function playCoinflip({ guildId, userId, bet, choice }) {
  if (bet <= 0) return { error: "賭け金が不正です" };
  if (!(await canAfford(guildId, userId, bet))) {
    return { error: "お金が足りません" };
  }

  await subtractBalance(guildId, userId, bet);

  const result = Math.random() < 0.5 ? "heads" : "tails";
  const win = result === choice;

  if (win) {
    await addBalance(guildId, userId, bet * 2);
  }

  return {
    win,
    result,
    bet,
    profit: win ? bet : -bet,
    balance: await getBalance(guildId, userId)
  };
}
