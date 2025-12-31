import { dealHand } from "./pokerDeck.js";
import { judgePoker } from "./pokerLogic.js";
import { readGuildDB, writeGuildDB } from "../file.js";

export async function playPoker({ guildId, userId, bet }) {
  const db = await readGuildDB();
  const user = db[guildId]?.users?.[userId];

  if (!user || user.money < bet) {
    return { error: "所持金が足りません" };
  }

  user.money -= bet;

  const hand = dealHand();
  const result = judgePoker(hand);
  const payout = Math.floor(bet * result.rate);

  if (payout > 0) {
    user.money += payout;
  }

  await writeGuildDB(db);

  return {
    hand,
    bet,
    result,
    payout
  };
}
