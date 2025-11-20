// src/data/guilds/guildDB.js

import fs from "fs/promises";
import path from "path";

const guildDBPath = path.resolve("src", "data", "guilds", "guilds.json");

// ===============================
// 📌 JSON初期化
// ===============================
async function init() {
  try {
    await fs.access(guildDBPath);
  } catch {
    await fs.mkdir(path.dirname(guildDBPath), { recursive: true });
    await fs.writeFile(guildDBPath, JSON.stringify({}, null, 2));
  }
}

// ===============================
// 📌 データ読み込み（1サーバー分）
// ===============================
export async function readGuildDB(guildId = null) {
  await init();

  const raw = await fs.readFile(guildDBPath, "utf-8");
  const db = JSON.parse(raw);

  if (!guildId) return db; // 全部返す

  if (!db[guildId]) {
    db[guildId] = {
      // ===== レベリング関連 =====
      xpIgnoreChannels: [],     // XP 無効チャンネル
      vxpIgnoreChannels: [],    // VXP 無効チャンネル
      voiceSession: {},         // VC滞在記録
      levelingRewards: {};      // レベル → 付与ロール

      // ====== 経済設定 ======
      currency: "💰",           // 通貨記号
      startBalance: 0,          // 新規ユーザー初期金額
      interestRate: 0,          // 利子（%）
      cooldowns: {              // 各コマンドのCD（秒）
        work: 60,
        slut: 60,
        crime: 60,
      },

      income: {                 // /set income（最小・最大）
        work: { min: 10, max: 50 },
        slut: { min: 20, max: 80 },
        crime: { min: 30, max: 120 },
      },

      fines: {                  // /set fine
        slut: { min: 10, max: 40 },
        crime: { min: 20, max: 80 },
      },

      failRate: {               // /set fail rate
        slut: 0.0,              // 30%
        crime: 0.0,
      },

      customReplies: {          // /add reply
        work: {
          success: [],
          fail: [], // failは通常なし
        },
        slut: {
          success: [],
          fail: [],
        },
        crime: {
          success: [],
          fail: [],
        },
      },

      roleIncome: {},           // roleId → 金額（ロール収入）
      reactIncome: {
        enabled: false,
        channelId: null,
        roleId: null,
        amount: 0,
        emoji: null,
      },

      // ===== 経済データ（ユーザー）=====
      users: {},                // レベリングとは分けた経済データ
    };

    await fs.writeFile(guildDBPath, JSON.stringify(db, null, 2));
  }

  return db[guildId];
}

// ===============================
// 📌 ギルドデータ保存
// ===============================
export async function writeGuildDB(db) {
  await init();
  await fs.writeFile(guildDBPath, JSON.stringify(db, null, 2));
      }
