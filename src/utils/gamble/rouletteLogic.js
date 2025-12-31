/* ======================
   ルーレット定義
====================== */

// 赤の数字（ヨーロピアン）
const RED_NUMBERS = new Set([
  1,3,5,7,9,12,14,16,18,
  19,21,23,25,27,30,32,34,36
]);

/* ======================
   回転
====================== */
export function spinRoulette() {
  return Math.floor(Math.random() * 37); // 0-36
}

/* ======================
   色判定
====================== */
export function getColor(num) {
  if (num === 0) return "green";
  return RED_NUMBERS.has(num) ? "red" : "black";
}

/* ======================
   勝敗判定
====================== */
export function judgeBet({ result, bet }) {
  const { type, value } = bet;

  if (result === 0) {
    // 0 は number 以外すべて負け
    return type === "number" && value === 0;
  }

  switch (type) {
    case "red":
      return getColor(result) === "red";

    case "black":
      return getColor(result) === "black";

    case "odd":
      return result % 2 === 1;

    case "even":
      return result % 2 === 0;

    case "high":
      return result >= 19;

    case "low":
      return result <= 18;

    case "number":
      return result === value;

    default:
      return false;
  }
}

/* ======================
   配当倍率
====================== */
export function getRouletteRate(betType) {
  const table = {
    red: 2,
    black: 2,
    odd: 2,
    even: 2,
    high: 2,
    low: 2,
    number: 36
  };

  return table[betType] ?? 0;
}

/* ======================
   ルーレット実行（まとめ）
====================== */
export function resolveRoulette({ bets }) {
  const result = spinRoulette();

  let totalWin = 0;
  const details = [];

  for (const bet of bets) {
    const win = judgeBet({ result, bet });
    const rate = getRouletteRate(bet.type);
    const payout = win ? bet.amount * rate : 0;

    totalWin += payout;

    details.push({
      ...bet,
      win,
      rate,
      payout
    });
  }

  return {
    result,
    color: getColor(result),
    totalWin,
    details
  };
}
