// src/services/levelingService.js
import { readGuildDB, writeGuildDB } from "../utils/file.js";

// ===========================================
// 📌 ユーザーデータ初期化
// ===========================================
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

// ===========================================
// 📌 XPを加算（テキスト）
// ===========================================
export async function addXP(guildId, userId, amount) {
  const guildData = await readGuildDB();

  initUser(guildData, guildId, userId);

  const user = guildData[guildId].users[userId];

  user.xp += amount;

  const requiredXP = user.level * 100;
  let leveledUp = false;

  if (user.xp >= requiredXP) {
    user.level++;
    leveledUp = true;
  }

  await writeGuildDB(guildData);

  return {
    leveledUp,
    newLevel: user.level,
  };
}

// ===========================================
// 📌 VXPを加算（ボイスチャット）
// ===========================================
export async function addVXP(guildId, userId, amount) {
  const guildData = await readGuildDB();

  initUser(guildData, guildId, userId);

  const user = guildData[guildId].users[userId];

  user.vxp += amount;

  const requiredVXP = user.vlevel * 100;
  let leveledUp = false;

  if (user.vxp >= requiredVXP) {
    user.vlevel++;
    leveledUp = true;
  }

  await writeGuildDB(guildData);

  return {
    leveledUp,
    newLevel: user.vlevel,
  };
}

// ===========================================
// 📌 現在のXP & レベルを取得
// ===========================================
export async function getUserLevel(guildId, userId) {
  const guildData = await readGuildDB();
  if (!guildData[guildId] || !guildData[guildId].users[userId]) return null;

  const user = guildData[guildId].users[userId];
  return {
    xp: user.xp,
    level: user.level,
    vxp: user.vxp,
    vlevel: user.vlevel,
  };
}
