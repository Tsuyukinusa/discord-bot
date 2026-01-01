// src/Services/gachaServices.js
import { readGuildDB, writeGuildDB } from "../utils/core/file.js";

/**
 * 抽選処理（重み付き）
 */
function drawByRarity(contents) {
  const total = contents.reduce((sum, c) => sum + c.rarity, 0);
  let rand = Math.random() * total;

  for (const c of contents) {
    if (rand < c.rarity) return c;
    rand -= c.rarity;
  }
  return contents[0]; // 保険
}

/**
 * ガチャを回す
 */
export async function rollGacha(guildId, userId, gachaId) {
  const db = await readGuildDB();

  const gacha = db[guildId]?.gachas?.[gachaId];
  if (!gacha) throw new Error("ガチャが存在しません");

  if (!db[guildId].users[userId]) {
    db[guildId].users[userId] = {
      balance: 0,
      xp: 0,
      vxp: 0,
      stockTicket: 0
    };
  }

  const user = db[guildId].users[userId];

  if (user.balance < gacha.price) {
    throw new Error("所持金が足りません");
  }

  // 支払い
  user.balance -= gacha.price;

  // 抽選
  const result = drawByRarity(gacha.contents);

  // 付与処理
  switch (result.type) {
    case "money":
      user.balance += result.amount;
      break;

    case "xp":
      user.xp = (user.xp || 0) + result.amount;
      break;

    case "vxp":
      user.vxp = (user.vxp || 0) + result.amount;
      break;

    case "stock":
      user.stockTicket = (user.stockTicket || 0) + result.amount;
      break;

    case "other":
      // 将来：アイテム付与など
      break;
  }

  await writeGuildDB(db);

  return result;
}
