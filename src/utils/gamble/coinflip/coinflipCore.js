// utils/gamble/coinflipCore.js
import { readGuildDB, writeGuildDB } from "../utils/core/file.js";

export function playCoinflip({
  guildId,
  userId,
  bet,
  choice // "heads" | "tails"
}) {
  const user = getUser(guildId, userId);

  if (!user || user.balance < bet || bet <= 0) {
    return { error: "お金が足りません" };
  }

  // 🔽 先に賭け金を引く
  user.balance -= bet;

  const result = Math.random() < 0.5 ? "heads" : "tails";
  const win = result === choice;

  let profit = 0;

  if (win) {
    // 🔼 勝ったら2倍返し
    user.money += bet * 2;
    profit = bet;
  } else {
    profit = -bet;
  }

  saveUser(guildId, userId, user);

  return {
    win,
    result,
    bet,
    profit,        // +bet or -bet
    money: user.money
  };
}
