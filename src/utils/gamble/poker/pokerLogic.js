/* ======================
   ポーカー役判定
====================== */
export function judgePoker(hand) {
  // value: 1(A)〜13(K)
  const values = hand.map(c => c.value).sort((a, b) => a - b);
  const suits = hand.map(c => c.suit);

  // 同じ数字の枚数カウント
  const counts = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  const countValues = Object.values(counts).sort((a, b) => b - a);

  // フラッシュ
  const isFlush = suits.every(s => s === suits[0]);

  // ストレート（A2345 と 10JQKA 両対応）
  const isNormalStraight = values.every(
    (v, i) => i === 0 || v === values[i - 1] + 1
  );
  const isLowAceStraight =
    JSON.stringify(values) === JSON.stringify([1, 2, 3, 4, 5]);
  const isRoyalValues =
    JSON.stringify(values) === JSON.stringify([1, 10, 11, 12, 13]);

  const isStraight = isNormalStraight || isLowAceStraight;

  /* ===== 判定 ===== */

  if (isFlush && isRoyalValues) {
    return { rank: "royal_flush", name: "ロイヤルフラッシュ", rate: 100 };
  }

  if (isFlush && isStraight) {
    return { rank: "straight_flush", name: "ストレートフラッシュ", rate: 50 };
  }

  if (countValues[0] === 4) {
    return { rank: "four", name: "フォーカード", rate: 25 };
  }

  if (countValues[0] === 3 && countValues[1] === 2) {
    return { rank: "full_house", name: "フルハウス", rate: 10 };
  }

  if (isFlush) {
    return { rank: "flush", name: "フラッシュ", rate: 7 };
  }

  if (isStraight) {
    return { rank: "straight", name: "ストレート", rate: 5 };
  }

  if (countValues[0] === 3) {
    return { rank: "three", name: "スリーカード", rate: 3 };
  }

  if (countValues[0] === 2 && countValues[1] === 2) {
    return { rank: "two_pair", name: "ツーペア", rate: 2 };
  }

  if (countValues[0] === 2) {
    return { rank: "one_pair", name: "ワンペア", rate: 1.5 };
  }

  return { rank: "lose", name: "役なし", rate: 0 };
}
