// utils/gamble/DiceCore.js
import { readGuildDB, writeGuildDB } from "../utils/core/file.js";
import { rollDice, judgeDice, getDicePayout } from "./diceLogic.js";

export async function playDice({
  guildId,
  userId,
  diceCount,
  betType,
  bet,
}) {
  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];

  if (!user) return { error: "ユーザーデータがありません" };
  if (bet <= 0) return { error: "賭け金が不正です" };
  if (user.balance < bet) return { error: "お金が足りません" };

  // ダイス数と賭け方の整合性
  if (
    (betType === "pair" && diceCount !== 2) ||
    (["triple", "straight"].includes(betType) && diceCount !== 3)
  ) {
    return { error: "その賭け方はそのダイス数では使えません" };
  }

  user.balance -= bet;

  const dice = rollDice(diceCount);
  const sum = dice.reduce((a, b) => a + b, 0);
  const win = judgeDice({ dice, betType });
  const rate = getDicePayout(betType);

  const payout = win ? Math.floor(bet * rate) : 0;
  if (win) user.balance += payout;

  await writeGuildDB(db);

  return {
    dice,
    sum,
    betType,
    bet,
    win,
    rate,
    payout,
    balance: user.balance
  };
}
