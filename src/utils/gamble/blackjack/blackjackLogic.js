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
