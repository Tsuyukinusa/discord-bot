// src/events/ready.js

import rankSelectHandler from "../selects/rankSelect.js"; // ← セレクトメニューのファイル

export default {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`✅ ログインしました: ${client.user.tag}`);

    // ====== セレクトメニューのハンドラーマップ作成 ======
    client.selectHandlers = new Map();

    // ====== ボタンのハンドラーマップ作成 ======
    client.buttonHandlers = new Map();

    // ====== rank のセレクトメニューを登録 ======
    client.selectHandlers.set("rank-select", rankSelectHandler);

    // ====== rank のボタンを登録 ======
    client.buttonHandlers.set("rank:prev", rankSelectHandler);
    client.buttonHandlers.set("rank:next", rankSelectHandler);

    // ====== ステータス設定 ======
    client.user.setPresence({
      activities: [
        {
          name: "経済 & カジノ & レベリング",
          type: 0,
        },
      ],
      status: "online",
    });

    console.log("🚀 Bot が完全に起動しました！");
  },
};
