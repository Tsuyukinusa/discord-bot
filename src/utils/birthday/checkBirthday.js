import { readGuildDB, writeGuildDB } from "../core/file.js";

export async function checkBirthday(client) {
  const db = await readGuildDB();

  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const month = jst.getMonth() + 1;
  const day = jst.getDate();
  const todayKey = jst.toISOString().slice(0, 10);

  for (const guildId in db) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const users = db[guildId].users ?? {};

    for (const userId in users) {
      const user = users[userId];
      if (!user.birthday) continue;

      if (
        user.birthday.month === month &&
        user.birthday.day === day &&
        user.lastBirthdayCelebrated !== todayKey
      ) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) continue;

        // 🎉 お祝い送信（system / general チャンネルなど）
        const channel = guild.systemChannel;
        if (channel) {
          channel.send(
            `🎉🎂 **${member} さん、誕生日おめでとう！** 🎂🎉`
          );
        }

        user.lastBirthdayCelebrated = todayKey;
      }
    }
  }

  await writeGuildDB(db);
}
