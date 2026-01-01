// services/economyServices.js
import { readGuildDB, writeGuildDB } from "../utils/core/file.js";

export async function getBalance(guildId, userId) {
  const db = await readGuildDB();
  return db[guildId]?.users?.[userId]?.balance ?? 0;
}

export async function addBalance(guildId, userId, amount) {
  const db = await readGuildDB();
  db[guildId].users[userId].balance += amount;
  await writeGuildDB(db);
}

export async function subtractBalance(guildId, userId, amount) {
  const db = await readGuildDB();
  if (db[guildId].users[userId].balance < amount) return false;
  db[guildId].users[userId].balance -= amount;
  await writeGuildDB(db);
  return true;
}
