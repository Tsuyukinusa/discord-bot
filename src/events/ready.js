import rankSelectHandler from "../selects/rankSelect.js";
import { startStockUpdater } from "../utils/stockUpdater.js";

export default {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`✅ ログインしました: ${client.user.tag}`);

    client.selectHandlers = new Map();
    client.selectHandlers.set("rank-select", rankSelectHandler);

    client.buttonHandlers = new Map();
    client.buttonHandlers.set("rank", rankSelectHandler);

    // 🟢 株価自動更新スタート
    startStockUpdater(client);

    client.user.setPresence({
      activities: [{ name: "経済 & カジノ & レベリング", type: 0 }],
      status: "online",
    });

    console.log("🚀 Bot が完全に起動しました！");
  },
};
