export function judgePoker(hand) {
  const values = hand.map(c => c.value).sort((a,b)=>a-b);
  const suits = hand.map(c => c.suit);

  const counts = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const countValues = Object.values(counts).sort((a,b)=>b-a);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight =
    values.every((v,i)=> i===0 || v === values[i-1]+1) ||
    JSON.stringify(values) === JSON.stringify([1,10,11,12,13]);

  if (isFlush && JSON.stringify(values) === JSON.stringify([1,10,11,12,13]))
    return { name: "ロイヤルフラッシュ", rate: 100 };

  if (isFlush && isStraight)
    return { name: "ストレートフラッシュ", rate: 50 };

  if (countValues[0] === 4)
    return { name: "フォーカード", rate: 25 };

  if (countValues[0] === 3 && countValues[1] === 2)
    return { name: "フルハウス", rate: 10 };

  if (isFlush)
    return { name: "フラッシュ", rate: 7 };

  if (isStraight)
    return { name: "ストレート", rate: 5 };

  if (countValues[0] === 3)
    return { name: "スリーカード", rate: 3 };

  if (countValues[0] === 2 && countValues[1] === 2)
    return { name: "ツーペア", rate: 2 };

  if (countValues[0] === 2)
    return { name: "ワンペア", rate: 1.5 };

  return { name: "ハズレ", rate: 0 };
}
