// src/utils/economy/dailyUpdater.js
import { readGuildDB, writeGuildDB } from "../core/file.js";

function getJSTDateString() {
  const now = new Date();
  now.setHours(now.getHours() + 9); // UTC → JST
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function startDailyUpdater(client) {
  setInterval(async () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const hours = now.getHours();

    // 🔒 0:00〜0:01 の1分間だけ実行
    if (!(hours === 0 && minutes === 0)) return;

    const today = getJSTDateString();
    const db = await readGuildDB();

    for (const guildId in db) {
      const daily = db[guildId].daily;
      if (!daily?.enabled) continue;
      if (daily.lastRun === today) continue;

      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;

      for (const userId in db[guildId].users) {
        const user = db[guildId].users[userId];

        // 💰 所持金付与
        user.balance += daily.amount;
        user.lastDaily = today;

        // 🎭 ロール付与
        if (daily.roleId) {
          const member = await guild.members.fetch(userId).catch(() => null);
          if (member && !member.roles.cache.has(daily.roleId)) {
            await member.roles.add(daily.roleId).catch(() => {});
          }
        }
      }

      daily.lastRun = today;
    }

    await writeGuildDB(db);
  }, 60 * 1000); // 1分ごとチェック
}
