// src/utils/core/economyUtil.js
import { readGuildDB, writeGuildDB } from "./file.js";

export async function getBalance(guildId, userId) {
  const db = await readGuildDB();
  return db[guildId]?.users?.[userId]?.money ?? 0;
}

export async function addBalance(guildId, userId, amount) {
  const db = await readGuildDB();
  db[guildId].users[userId].money += amount;
  await writeGuildDB(db);
}

export async function subtractBalance(guildId, userId, amount) {
  const db = await readGuildDB();
  if (db[guildId].users[userId].money < amount) return false;
  db[guildId].users[userId].money -= amount;
  await writeGuildDB(db);
  return true;
}
