import { readGuildDB, writeGuildDB } from "../file.js";
import { judgePoker } from "./pokerLogic.js";
import { drawPokerHand } from "./pokerCards.js";

export async function playPoker({ guildId, userId, bet }) {
  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];

  if (!user || user.money < bet) {
    return { error: "所持金が足りません" };
  }

  // 賭け金を先に引く
  user.money -= bet;

  // カード生成
  const hand = drawPokerHand();

  // 判定
  const result = judgePoker(hand);
  const payout = Math.floor(bet * result.rate);

  if (payout > 0) {
    user.money += payout;
  }

  await writeGuildDB(db);

  return {
    hand,
    bet,
    ...result,
    payout
  };
}
