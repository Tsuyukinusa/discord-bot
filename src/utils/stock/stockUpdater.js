// utils/stockUpdater.js
import { readGuildDB, writeGuildDB } from "./file.js";

export async function startStockUpdater(client) {
  setInterval(async () => {
    const now = new Date();
    const time = now.toTimeString().slice(0, 5); // HH:MM

    const db = await readGuildDB();

    for (const guildId in db) {
      const config = db[guildId].stockConfig;
      if (!config) continue;

      if (!config.updateTimes.includes(time)) continue;
      if (config.lastRun === time) continue;

      config.lastRun = time;

      await updateAllStocks(guildId, db, client);
    }

    await writeGuildDB(db);
  }, 60 * 1000);
}
