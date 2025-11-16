import rankSelectHandler from "../selects/rankSelect.js";

export default {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`✅ ログインしました: ${client.user.tag}`);

    client.selectHandlers = new Map();
    client.selectHandlers.set("rank-select", rankSelectHandler);

    client.buttonHandlers = new Map();
    client.buttonHandlers.set("rank", rankSelectHandler);

    client.user.setPresence({
      activities: [{ name: "経済 & カジノ & レベリング", type: 0 }],
      status: "online",
    });

    console.log("🚀 Bot が完全に起動しました！");
  },
};
