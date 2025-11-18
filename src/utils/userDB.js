// src/utils/userDB.js
import fs from "fs";
import path from "path";

const usersDir = path.resolve("src/data/users");

// ===============================
// 📌 フォルダが無ければ作成する
// ===============================
if (!fs.existsSync(usersDir)) {
  fs.mkdirSync(usersDir, { recursive: true });
}

// ===============================
// 📌 ユーザーファイルのパスを取得
// ===============================
function getUserFilePath(guildId, userId) {
  const guildFolder = path.join(usersDir, guildId);

  if (!fs.existsSync(guildFolder)) {
    fs.mkdirSync(guildFolder, { recursive: true });
  }

  return path.join(guildFolder, `${userId}.json`);
}

// ===============================
// 📌 読み込み（なければ初期化）
// ===============================
export async function readUserData(guildId, userId) {
  const filePath = getUserFilePath(guildId, userId);

  // 既存のファイルがあるなら読み込む
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  }

  // 初期データ（自由に拡張可能）
  const defaultData = {
    money: 0,
    bank: 0,
    inventory: [],
    cooldowns: {
      work: 0,
      slut: 0,
      crime: 0,
    },
    createdItems: [], // このユーザーが作成したアイテムのID
  };

  fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  return defaultData;
}

// ===============================
// 📌 書き込み（完全保存）
// ===============================
export async function writeUserData(guildId, userId, data) {
  const filePath = getUserFilePath(guildId, userId);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ===============================
// 📌 お金の増減（サービス層から呼ぶ）
// ===============================
export async function addMoney(guildId, userId, amount) {
  const data = await readUserData(guildId, userId);
  data.money += amount;
  await writeUserData(guildId, userId, data);
  return data.money;
}

export async function removeMoney(guildId, userId, amount) {
  const data = await readUserData(guildId, userId);
  data.money = Math.max(0, data.money - amount);
  await writeUserData(guildId, userId, data);
  return data.money;
}

// ===============================
// 📌 銀行の増減
// ===============================
export async function addBank(guildId, userId, amount) {
  const data = await readUserData(guildId, userId);
  data.bank += amount;
  await writeUserData(guildId, userId, data);
  return data.bank;
}

export async function removeBank(guildId, userId, amount) {
  const data = await readUserData(guildId, userId);
  data.bank = Math.max(0, data.bank - amount);
  await writeUserData(guildId, userId, data);
  return data.bank;
}
