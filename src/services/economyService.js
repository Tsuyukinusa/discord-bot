// src/services/economyService.js
import { readGuildDB, writeGuildDB } from "../utils/core/file.js";

function initUser(db, guildId, userId) {
  if (!db[guildId]) db[guildId] = {};
  if (!db[guildId].users) db[guildId].users = {};

  if (!db[guildId].users[userId]) {
    db[guildId].users[userId] = {
      balance: 100,
      bank: 0,
      diamond: 0
    };
  }
}

export async function getEconomyUser(guildId, userId) {
  const db = await readGuildDB();
  initUser(db, guildId, userId);
  await writeGuildDB(db);
  return db[guildId].users[userId];
}

export async function canAfford(guildId, userId, amount) {
  const user = await getEconomyUser(guildId, userId);
  return user.balance >= amount;
}

export async function withdraw(guildId, userId, amount) {
  const db = await readGuildDB();
  initUser(db, guildId, userId);

  const user = db[guildId].users[userId];
  if (user.balance < amount) {
    return { error: "残高不足" };
  }

  user.balance -= amount;
  await writeGuildDB(db);
  return user.balance;
}

export async function deposit(guildId, userId, amount) {
  const db = await readGuildDB();
  initUser(db, guildId, userId);

  db[guildId].users[userId].balance += amount;
  await writeGuildDB(db);
}

export async function addBalance(guildId, userId, diff) {
  const db = await readGuildDB();
  initUser(db, guildId, userId);

  db[guildId].users[userId].balance += diff;
  await writeGuildDB(db);

  return db[guildId].users[userId].balance;
}
