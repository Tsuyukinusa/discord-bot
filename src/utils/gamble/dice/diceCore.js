import { takeBalance, addBalance, getBalance } from "../Services/economyServices.js";

export async function playDice({ guildId, userId, diceCount, betType, bet }) {
  const ok = await takeBalance(guildId, userId, bet);
  if (!ok) return { error: "お金が足りません" };

  const dice = rollDice(diceCount);
  const win = judgeDice({ dice, betType });
  const rate = getDicePayout(betType);

  const payout = win ? Math.floor(bet * rate) : 0;
  if (win) await addBalance(guildId, userId, payout);

  return {
    dice,
    bet,
    win,
    payout,
    balance: await getBalance(guildId, userId)
  };
}
