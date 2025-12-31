// utils/gamble/pokerLogic.js

/* ======================
   ポーカー役判定
====================== */
export function judgePoker(hand) {
  // value: 1(A) ～ 13(K)
  const values = hand.map(c => c.value).sort((a, b) => a - b);
  const suits = hand.map(c => c.suit);

  /* ===== カウント ===== */
  const counts = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const countValues = Object.values(counts).sort((a, b) => b - a);

  /* ===== フラッシュ ===== */
  const isFlush = suits.every(s => s === suits[0]);

  /* ===== ストレート ===== */
  const isNormalStraight =
    values.every((v, i) => i === 0 || v === values[i - 1] + 1);

  // A,10,J,Q,K
  const isRoyal =
    JSON.stringify(values) === JSON.stringify([1, 10, 11, 12, 13]);

  const isStraight = isNormalStraight || isRoyal;

  /* ======================
     役判定
  ====================== */
  if (isFlush && isRoyal)
    return { rank: "royal_flush", rate: 100 };

  if (isFlush && isStraight)
    return { rank: "straight_flush", rate: 50 };

  if (countValues[0] === 4)
    return { rank: "four_of_a_kind", rate: 25 };

  if (countValues[0] === 3 && countValues[1] === 2)
    return { rank: "full_house", rate: 10 };

  if (isFlush)
    return { rank: "flush", rate: 7 };

  if (isStraight)
    return { rank: "straight", rate: 5 };

  if (countValues[0] === 3)
    return { rank: "three_of_a_kind", rate: 3 };

  if (countValues[0] === 2 && countValues[1] === 2)
    return { rank: "two_pair", rate: 2 };

  if (countValues[0] === 2)
    return { rank: "one_pair", rate: 1.5 };

  return { rank: "lose", rate: 0 };
}
