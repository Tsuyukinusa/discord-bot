// utils/gamble/slotLogic.js

/* ======================
   リールを回す
====================== */
export function spinReels(symbols) {
  return Array.from({ length: 3 }, () => {
    const pick = symbols[Math.floor(Math.random() * symbols.length)];
    return pick.emoji;
  });
}

/* ======================
   揃い判定
====================== */
export function judgeSlot(result, symbols) {
  const counts = {};

  for (const r of result) {
    counts[r] = (counts[r] || 0) + 1;
  }

  // 3つ揃い or 2つ揃い を探す
  for (const symbol of symbols) {
    const count = counts[symbol.emoji] || 0;

    if (count === 3) {
      return {
        win: true,
        type: "triple",
        emoji: symbol.emoji,
        rate: symbol.rate3
      };
    }

    if (count === 2) {
      return {
        win: true,
        type: "pair",
        emoji: symbol.emoji,
        rate: symbol.rate2
      };
    }
  }

  return {
    win: false,
    type: "lose",
    rate: 0
  };
}

/* ======================
   スロット実行（まとめ）
====================== */
export function playSlot({ bet, symbols }) {
  const reels = spinReels(symbols);
  const judge = judgeSlot(reels, symbols);

  return {
    reels,
    ...judge,
    payout: judge.win ? Math.floor(bet * judge.rate) : 0
  };
}
