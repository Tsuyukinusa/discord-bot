import { readGuildDB, writeGuildDB } from "../utils/core/file.js";

function initGuild(db, guildId) {
  if (!db[guildId]) db[guildId] = {};
  if (!db[guildId].economy) {
    db[guildId].economy = {
      enabled: false,
      currency: "💰",
      startBalance: 100,
      cooldowns: {
        work: 3600,
        slut: 7200,
        crime: 7200,
      },
      income: {
        work: { min: 10, max: 50, diamond: 1 },
        slut: { min: 20, max: 100, diamond: 2 },
        crime: { min: 30, max: 120, diamond: 3 },
      },
      fines: {
        slut: { min: 10, max: 40 },
        crime: { min: 10, max: 60 },
      },
      failRates: {
        slut: 0.3,
        crime: 0.3,
      },
      interestRate: 0.01,
      roleIncome: {},
      customReplies: {}
    };
  }
}

function initUser(db, guildId, userId) {
  if (!db[guildId].users) db[guildId].users = {};

  if (!db[guildId].users[userId]) {
    db[guildId].users[userId] = {
      balance: db[guildId].economy.startBalance,
      bank: 0,
      diamond: 0,

      cooldowns: {
        work: 0,
        slut: 0,
        crime: 0,
      },

      inventory: {},
    };
  }
}

export async function ensureUser(guildId, userId) {
  const db = await readGuildDB();

  initGuild(db, guildId);
  initUser(db, guildId, userId);

  await writeGuildDB(db);

  return db[guildId].users[userId];
}

export async function getUser(guildId, userId) {
  const db = await readGuildDB();

  if (!db[guildId] || !db[guildId].users || !db[guildId].users[userId]) {
    return null;
  }

  return db[guildId].users[userId];
}
