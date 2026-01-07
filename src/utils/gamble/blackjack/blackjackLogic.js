/**
 * カード配列からブラックジャックの合計値を計算する
 * @param {Array<{ value: string | number }>} hand
 * @returns {number}
 */
export function calcHand(hand) {
  let total = 0;
  let aceCount = 0;

  for (const card of hand) {
    const v = card.value;

    if (v === "A") {
      total += 11;
      aceCount++;
    } else if (["K", "Q", "J"].includes(v)) {
      total += 10;
    } else {
      total += Number(v);
    }
  }
  // A を 11 → 1 に調整（バースト回避）
  while (total > 21 && aceCount > 0) {
    total -= 10;
    aceCount--;
  }

  return total;
}
const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

/**
 * ランダムにカードを1枚引く
 * @returns {{ value: string, display: string }}
 */
export function drawCard() {
  const value = VALUES[Math.floor(Math.random() * VALUES.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];

  return {
    value,
    display: `${value}${suit}`
  };
}
