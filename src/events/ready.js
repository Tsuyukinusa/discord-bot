// src/events/ready.js

import rankSelectHandler from "../selects/rankSelect.js"; // ランキングのセレクト/ボタン両対応 handler

export default {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`✅ ログインしました: ${client.user.tag}`);

    // ====== セレクトメニューのハンドラーマップ ======
    client.selectHandlers = new Map();

    // /rank のセレクトメニュー（XP / VXP / Profile）
    client.selectHandlers.set("rank-select", rankSelectHandler);

    // ====== ボタンのハンドラーマップ ======
    client.buttonHandlers = new Map();

    // ランキングページングボタン（prev / next）
    // customId は "rank:prev:xp:1" など → 前半の "rank" で一致する
    client.buttonHandlers.set("rank", rankSelectHandler);

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
