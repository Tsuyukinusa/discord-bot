export default {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`✅ ログインしました: ${client.user.tag}`);

    // Botのステータス設定
    client.user.setPresence({
      activities: [
        {
          name: "経済 & カジノ & レベリング",
          type: 0, // 0 = PLAYING
        },
      ],
      status: "online",
    });

    console.log("🚀 Bot が完全に起動しました！");
  },
};
