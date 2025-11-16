import { readGuildDB, writeGuildDB } from "../utils/file.js";

function initUser(guildData, guildId, userId) {
  if (!guildData[guildId]) guildData[guildId] = {};
  if (!guildData[guildId].users) guildData[guildId].users = {};

  if (!guildData[guildId].users[userId]) {
    guildData[guildId].users[userId] = {
      xp: 0,
      level: 1,
      vxp: 0,
      vlevel: 1,
    };
  }
}

export async function addXP(guildId, userId, amount) {
  const guildData = await readGuildDB();
  initUser(guildData, guildId, userId);
  const user = guildData[guildId].users[userId];
  user.xp += amount;

  let leveledUp = false;
  if (user.xp >= user.level * 100) {
    user.level++;
    leveledUp = true;
  }

  await writeGuildDB(guildData);
  return { leveledUp, newLevel: user.level };
}

export async function addVXP(guildId, userId, amount) {
  const guildData = await readGuildDB();
  initUser(guildData, guildId, userId);
  const user = guildData[guildId].users[userId];
  user.vxp += amount;

  let leveledUp = false;
  if (user.vxp >= user.vlevel * 100) {
    user.vlevel++;
    leveledUp = true;
  }

  await writeGuildDB(guildData);
  return { leveledUp, newLevel: user.vlevel };
}

export async function getUserLevel(guildId, userId) {
  const guildData = await readGuildDB();
  if (!guildData[guildId] || !guildData[guildId].users[userId]) return null;
  const user = guildData[guildId].users[userId];
  return { xp: user.xp, level: user.level, vxp: user.vxp, vlevel: user.vlevel };
}
