import {
  hasMoney,
  takeMoney,
  addMoney,
  getUser
} from "../../../services/economyService.js";

export async function playCoinflip({
  guildId,
  userId,
  bet,
  choice // "heads" | "tails"
}) {
  if (bet <= 0) return { error: "無効な金額です" };

  if (!(await hasMoney(guildId, userId, bet))) {
    return { error: "お金が足りません" };
  }

  // 先に支払い
  await takeMoney(guildId, userId, bet);

  const result = Math.random() < 0.5 ? "heads" : "tails";
  const win = result === choice;

  let profit = -bet;

  if (win) {
    await addMoney(guildId, userId, bet * 2);
    profit = bet;
  }

  const user = await getUser(guildId, userId);

  return {
    win,
    result,
    bet,
    profit,
    balance: user.balance
  };
}
