// utils/gamble/DiceCore.js
import { readGuildDB, writeGuildDB } from "../file.js";

/* ======================
   ダイスを振る
====================== */
export function rollDice(count) {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * 6) + 1
  );
}

/* ======================
   High / Low 境界
====================== */
function highLowBorder(count) {
  if (count === 1) return 4;
  if (count === 2) return 7;
  if (count === 3) return 11;
}

/* ======================
   勝敗判定
====================== */
export function judgeDice(dice, betType) {
  const sum = dice.reduce((a, b) => a + b, 0);

  switch (betType) {
    case "odd":
      return sum % 2 === 1;

    case "even":
      return sum % 2 === 0;

    case "high":
      return sum >= highLowBorder(dice.length);

    case "low":
      return sum < highLowBorder(dice.length);

    case "pair":
      return dice.length === 2 && dice[0] === dice[1];

    case "triple":
      return dice.length === 3 && dice.every(d => d === dice[0]);

    case "straight": {
      if (dice.length !== 3) return false;
      const s = [...dice].sort((a, b) => a - b);
      return s[1] === s[0] + 1 && s[2] === s[1] + 1;
    }

    default:
      return false;
  }
}

/* ======================
   配当
====================== */
export function getDiceRate(type) {
  return {
    odd: 1.9,
    even: 1.9,
    high: 2,
    low: 2,
    pair: 5,
    triple: 30,
    straight: 12
  }[type] ?? 0;
}

/* ======================
   実行
====================== */
export async function playDice({
  guildId,
  userId,
  diceCount,
  betType,
  bet
}) {
  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];

  if (!user || user.money < bet) {
    return { error: "お金が足りません" };
  }

  user.money -= bet;

  const dice = rollDice(diceCount);
  const win = judgeDice(dice, betType);
  const rate = getDiceRate(betType);
  const payout = win ? Math.floor(bet * rate) : 0;

  if (win) user.money += payout;

  await writeGuildDB(db);

  return {
    dice,
    sum: dice.reduce((a, b) => a + b, 0),
    win,
    bet,
    rate,
    payout
  };
}
