// utils/gamble/slotLogic.js

/* ======================
   スロット設定
====================== */

/**
 * emoji: 表示する絵文字（Unicode / カスタムOK）
 * triple: 3つ揃いの配当倍率
 * double: 2つ揃いの配当倍率
 */
export const SLOT_SYMBOLS = [
  { emoji: "🍒", triple: 10, double: 2 },
  { emoji: "🍋", triple: 8,  double: 1.5 },
  { emoji: "🔔", triple: 15, double: 3 },
  { emoji: "💎", triple: 50, double: 5 },
  // カスタム絵文字例
  // { emoji: "<:gold:123456789012345678>", triple: 30, double: 4 }
];

/* ======================
   リールを回す
====================== */
export function spinReels() {
  return Array.from({ length: 3 }, () =>
    SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
  );
}

/* ======================
   勝敗判定
====================== */
export function judgeSlot(reels) {
  const emojis = reels.map(r => r.emoji);

  // 同じ絵文字の数を数える
  const counts = {};
  for (const e of emojis) {
    counts[e] = (counts[e] || 0) + 1;
  }

  // 最大一致数
  const maxMatch = Math.max(...Object.values(counts));

  // 揃った絵文字
  const matchedEmoji = Object.keys(counts).find(
    e => counts[e] === maxMatch
  );

  const symbol = SLOT_SYMBOLS.find(s => s.emoji === matchedEmoji);

  if (!symbol) {
    return { result: "lose", rate: 0 };
  }

  if (maxMatch === 3) {
    return {
      result: "triple",
      rate: symbol.triple
    };
  }

  if (maxMatch === 2) {
    return {
      result: "double",
      rate: symbol.double
    };
  }

  return { result: "lose", rate: 0 };
}

/* ======================
   スロット実行まとめ
====================== */
export function playSlot(bet) {
  const reels = spinReels();
  const judge = judgeSlot(reels);

  return {
    reels: reels.map(r => r.emoji),
    result: judge.result,      // triple / double / lose
    rate: judge.rate,
    payout: judge.rate > 0 ? Math.floor(bet * judge.rate) : 0
  };
}
