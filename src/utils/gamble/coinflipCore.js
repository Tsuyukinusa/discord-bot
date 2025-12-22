// utils/gamble/coinflipCore.js
import { getUser, saveUser } from "../userDB.js";

export function playCoinflip({
  guildId,
  userId,
  bet,
  choice // "heads" | "tails"
}) {
  const user = getUser(guildId, userId);

  if (user.money < bet) {
    return { error: "お金が足りません" };
  }

  const result = Math.random() < 0.5 ? "heads" : "tails";
  const win = result === choice;

  if (win) {
    user.money += bet;
  } else {
    user.money -= bet;
  }

  saveUser(guildId, userId, user);

  return {
    win,
    result,
    bet,
    money: user.money
  };
}
