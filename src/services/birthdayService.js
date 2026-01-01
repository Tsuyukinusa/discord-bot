// utils/services/birthdayServices.js
import { readGuildDB, writeGuildDB } from "../core/file.js";

const JST_OFFSET = 9 * 60 * 60 * 1000;

function getJSTDate() {
  return new Date(Date.now() + JST_OFFSET);
}

export async function checkBirthdays(client) {
  const db = await readGuildDB();
  const now = getJSTDate();

  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const year = now.getUTCFullYear();

  for (const guildId of Object.keys(db)) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const channelId = db[guildId]?.settings?.birthday?.channelId;
    const bonus = db[guildId]?.settings?.birthday?.bonusMoney ?? 0;
    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;

    const users = db[guildId]?.users ?? {};

    for (const [userId, user] of Object.entries(users)) {
      const b = user.birthday;
      if (!b) continue;

      if (
        b.month === month &&
        b.day === day &&
        b.lastCelebratedYear !== year
      ) {
        // 🎉 お祝い
        user.balance = (user.balance ?? 0) + bonus;
        b.lastCelebratedYear = year;

        await channel.send(
          `🎂 <@${userId}> さん誕生日おめでとう！！🎉\n💰 ボーナス **${bonus}** コイン獲得！`
        );
      }
    }
  }

  await writeGuildDB(db);
}
