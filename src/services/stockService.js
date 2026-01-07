import { readGuildDB, writeGuildDB } from "../utils/core/file.js";
import { getBalance, subtractBalance, addBalance } from "./economyService.js";

/* 株一覧取得 */
export async function getStocks(guildId) {
  const db = await readGuildDB();
  return db[guildId]?.stocks ?? {};
}

/* 株購入 */
export async function buyStock(guildId, userId, stockId, amount) {
  const db = await readGuildDB();
  const stock = db[guildId]?.stocks?.[stockId];
  if (!stock) throw new Error("STOCK_NOT_FOUND");

  const cost = stock.price * amount;
  const balance = await getBalance(guildId, userId);
  if (balance < cost) throw new Error("NOT_ENOUGH_MONEY");

  await subtractBalance(guildId, userId, cost);

  if (!db[guildId].users[userId].stocks) {
    db[guildId].users[userId].stocks = {};
  }

  db[guildId].users[userId].stocks[stockId] =
    (db[guildId].users[userId].stocks[stockId] || 0) + amount;

  await writeGuildDB(db);
}

/* 株売却 */
export async function sellStock(guildId, userId, stockId, amount) {
  const db = await readGuildDB();
  const userStocks = db[guildId]?.users?.[userId]?.stocks;
  if (!userStocks?.[stockId] || userStocks[stockId] < amount) {
    throw new Error("NOT_ENOUGH_STOCK");
  }

  const price = db[guildId].stocks[stockId].price;
  const total = price * amount;

  userStocks[stockId] -= amount;
  if (userStocks[stockId] <= 0) delete userStocks[stockId];

  await addBalance(guildId, userId, total);
  await writeGuildDB(db);
}
