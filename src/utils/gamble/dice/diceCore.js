import {
  canAfford,
  subtractBalance,
  addBalance,
  getBalance
} from "../../../Services/economyServices.js";
import { rollDice, judgeDice, getDicePayout } from "./diceLogic.js";

export async function playDice({
  guildId,
  userId,
  diceCount,
  betType,
  bet
}) {
  if (bet <= 0) return { error: "賭け金が不正です" };
  if (!(await canAfford(guildId, userId, bet))) {
    return { error: "お金が足りません" };
  }

  if (
    (betType === "pair" && diceCount !== 2) ||
    (["triple", "straight"].includes(betType) && diceCount !== 3)
  ) {
    return { error: "その賭け方は使えません" };
  }

  await subtractBalance(guildId, userId, bet);

  const dice = rollDice(diceCount);
  const win = judgeDice({ dice, betType });
  const rate = getDicePayout(betType);
  const payout = win ? Math.floor(bet * rate) : 0;

  if (win) await addBalance(guildId, userId, payout);

  return {
    dice,
    betType,
    bet,
    win,
    rate,
    payout,
    balance: await getBalance(guildId, userId)
  };
}
