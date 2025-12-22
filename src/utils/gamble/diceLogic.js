// utils/gamble/diceLogic.js

/* ======================
   ダイスを振る
====================== */
export function rollDice(count) {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * 6) + 1
  );
}

/* ======================
   勝敗判定
====================== */
export function judgeDice({ dice, betType, betValue }) {
  const sum = dice.reduce((a, b) => a + b, 0);

  switch (betType) {
    case "odd":
      return sum % 2 === 1;

    case "even":
      return sum % 2 === 0;

    case "high":
      return sum >= getHighLowBorder(dice.length);

    case "low":
      return sum < getHighLowBorder(dice.length);

    case "pair":
      return dice.length === 2 && dice[0] === dice[1];

    case "triple":
      return dice.length === 3 && dice.every(d => d === dice[0]);

    case "straight":
      if (dice.length !== 3) return false;
      const sorted = [...dice].sort();
      return (
        sorted[1] === sorted[0] + 1 &&
        sorted[2] === sorted[1] + 1
      );

    default:
      return false;
  }
}

/* ======================
   High / Low 境界
====================== */
function getHighLowBorder(diceCount) {
  if (diceCount === 1) return 4;   // 1-3 low / 4-6 high
  if (diceCount === 2) return 7;   // 2-6 low / 7-12 high
  if (diceCount === 3) return 11;  // 3-10 low / 11-18 high
}

/* ======================
   配当取得
====================== */
export function getDicePayout(betType) {
  const table = {
    odd: 1.9,
    even: 1.9,
    high: 2,
    low: 2,
    pair: 5,
    triple: 30,
    straight: 12
  };

  return table[betType] ?? 0;
}

/* ======================
   ダイス実行（まとめ）
====================== */
export function playDice({
  diceCount,
  betType,
  betValue,
  bet
}) {
  const dice = rollDice(diceCount);
  const win = judgeDice({ dice, betType, betValue });
  const rate = getDicePayout(betType);

  return {
    dice,
    sum: dice.reduce((a, b) => a + b, 0),
    win,
    rate,
    payout: win ? Math.floor(bet * rate) : 0
  };
}
