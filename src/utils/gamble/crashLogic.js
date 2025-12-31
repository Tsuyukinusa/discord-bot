// utils/gamble/crashLogic.js

/* ======================
   クラッシュ倍率生成
   （低倍率が出やすい）
====================== */
export function generateCrashPoint() {
  // よくある確率分布（低倍率寄り）
  const r = Math.random();

  // 1.00 ～ 無限（理論上）
  const crash = Math.max(
    1.01,
    Math.floor((1 / (1 - r)) * 100) / 100
  );

  return crash;
}

/* ======================
   現在倍率計算
====================== */
export function calcMultiplier(startTime) {
  const elapsed = (Date.now() - startTime) / 1000;

  // 徐々に加速する式
  const multiplier = 1 + elapsed * 0.08 + elapsed ** 1.3 * 0.02;

  return Math.floor(multiplier * 100) / 100;
}

/* ======================
   キャッシュアウト判定
====================== */
export function cashOut({ bet, multiplier }) {
  return Math.floor(bet * multiplier);
}

/* ======================
   クラッシュ判定
====================== */
export function isCrashed({ multiplier, crashPoint }) {
  return multiplier >= crashPoint;
}
