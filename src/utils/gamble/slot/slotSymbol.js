// src/utils/gamble/slot/slotSymbols.js
import { readGuildDB, writeGuildDB } from "../../core/file.js";

/*
  symbol = {
    emoji: "🍒",
    rate2: 1.5,   // 2つ揃い
    rate3: 3.0    // 3つ揃い
  }
*/

/* ======================
   デフォルトスロット
====================== */
const DEFAULT_SYMBOLS = [
  { emoji: "🍒", rate2: 1.5, rate3: 3 },
  { emoji: "🍋", rate2: 2,   rate3: 4 },
  { emoji: "🔔", rate2: 3,   rate3: 6 },
  { emoji: "💎", rate2: 5,   rate3: 10 }
];

/* ======================
   取得
====================== */
export async function getSlotSymbols(guildId) {
  const db = await readGuildDB();

  const symbols = db[guildId]?.slot?.symbols;

  if (!symbols || symbols.length === 0) {
    return DEFAULT_SYMBOLS;
  }

  return symbols;
}

/* ======================
   設定
====================== */
export async function setSlotSymbols(guildId, symbols) {
  const db = await readGuildDB();

  if (!db[guildId]) db[guildId] = {};
  if (!db[guildId].slot) db[guildId].slot = {};

  db[guildId].slot.symbols = symbols;

  await writeGuildDB(db);
}

/* ======================
   リセット
====================== */
export async function resetSlotSymbols(guildId) {
  const db = await readGuildDB();

  if (!db[guildId]) db[guildId] = {};
  if (!db[guildId].slot) db[guildId].slot = {};

  db[guildId].slot.symbols = DEFAULT_SYMBOLS;

  await writeGuildDB(db);
}
