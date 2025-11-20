// src/data/users/userDB.js

import fs from "fs/promises";
import path from "path";

const userDBPath = path.resolve("src", "data", "users", "users.json");

// ===============================
// 📌 JSON初期化
// ===============================
async function init() {
  try {
    await fs.access(userDBPath);
  } catch {
    await fs.mkdir(path.dirname(userDBPath), { recursive: true });
    await fs.writeFile(userDBPath, JSON.stringify({}, null, 2));
  }
}

// ===============================
// 📌 データ読み込み
// ===============================
export async function readUserDB(userId) {
  await init();

  const raw = await fs.readFile(userDBPath, "utf-8");
  const db = JSON.parse(raw);

  if (!db[userId]) {
    db[userId] = {
      balance: 0,        // 所持金
      bank: 0,           // 銀行
      diamonds: 0,       // ガチャダイヤ
      items: {},         // アイテム { itemName: 数量 }
    };
    await fs.writeFile(userDBPath, JSON.stringify(db, null, 2));
  }

  return db[userId];
}

// ===============================
// 📌 データ書き込み
// ===============================
export async function writeUserDB(userId, data) {
  await init();

  const raw = await fs.readFile(userDBPath, "utf-8");
  const db = JSON.parse(raw);

  db[userId] = data;

  await fs.writeFile(userDBPath, JSON.stringify(db, null, 2));
}

// ===============================
// 📌 全ユーザーDB取得（ランキング用）
// ===============================
export async function readAllUsers() {
  await init();

  const raw = await fs.readFile(userDBPath, "utf-8");
  return JSON.parse(raw);
}
