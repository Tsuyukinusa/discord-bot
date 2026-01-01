// utils/gamble/coinflipCore.js
import {
  getBalance,
  addBalance,
  subtractBalance
} from "../../services/economyServices.js";

export async function playCoinflip({
  guildId,
  userId,
  bet,
  choice // "heads" | "tails"
}) {
  if (bet <= 0) return { error: "無効な金額です" };

  const balance = await getBalance(guildId, userId);
  if (balance < bet) return { error: "お金が足りません" };

  // 先に引く
  await subtractBalance(guildId, userId, bet);

  const result = Math.random() < 0.5 ? "heads" : "tails";
  const win = result === choice;

  let profit = -bet;

  if (win) {
    await addBalance(guildId, userId, bet * 2);
    profit = bet;
  }

  const finalBalance = await getBalance(guildId, userId);

  return {
    win,
    result,
    bet,
    profit,
    balance: finalBalance
  };
}
