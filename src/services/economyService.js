// src/Services/economyServices.js
import { readGuildDB, writeGuildDB } from "../utils/core/file.js";

export async function getBalance(guildId, userId) {
const db = await readGuildDB();
return db[guildId]?.users?.[userId]?.balance ?? 0;
}

export async function canAfford(guildId, userId, amount) {
const balance = await getBalance(guildId, userId);
return balance >= amount;
}

export async function subtractBalance(guildId, userId, amount) {
const db = await readGuildDB();
db[guildId].users[userId].balance -= amount;
await writeGuildDB(db);
}

export async function addBalance(guildId, userId, amount) {
const db = await readGuildDB();
db[guildId].users[userId].balance += amount;
await writeGuildDB(db);
}
