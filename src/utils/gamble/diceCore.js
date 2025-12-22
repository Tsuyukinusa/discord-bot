// utils/gamble/diceCore.js
import { readGuildDB, writeGuildDB } from "../file.js";
import { playDice } from "./diceLogic.js";

/* ======================
   ダイス実行（お金込み）
====================== */
export async function playDiceGame({
  guildId,
  userId,
  diceCount,
  betType,
  betValue,
  bet
}) {
  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];

  if (!user) {
    return { error: "ユーザーデータが見つかりません" };
  }

  if (bet <= 0) {
    return { error: "賭け金は1以上にしてください" };
  }

  if (user.money < bet) {
    return { error: "所持金が足りません" };
  }

  // 賭け金を先に引く
  user.money -= bet;

  // ロジック実行
  const result = playDice({
    diceCount,
    betType,
    betValue,
    bet
  });

  // 払い戻し
  if (result.win) {
    user.money += result.payout;
  }

  await writeGuildDB(db);

  return {
    ...result,
    bet,
    afterMoney: user.money
  };
}
