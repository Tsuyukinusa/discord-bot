// ================================
// 🚀 deploy-commands.js
// ================================
// Discord.js v14 用スラッシュコマンド登録スクリプト
// ================================

import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

// ====== .env または GitHub Secrets に設定しておく ======
// TOKEN=あなたのBotトークン
// CLIENT_ID=あなたのBotのクライアントID
// GUILD_ID=あなたのサーバーID（テスト用）

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ================================
// 🔧 スラッシュコマンド定義
// ================================
const commands = [
  new SlashCommandBuilder().setName("balance").setDescription("自分の残高を確認します"),

  new SlashCommandBuilder()
    .setName("set_currency")
    .setDescription("通貨名と絵文字を設定します（管理者専用）")
    .addStringOption(opt => opt.setName("name").setDescription("通貨名").setRequired(true))
    .addStringOption(opt => opt.setName("emoji").setDescription("通貨絵文字")),

  new SlashCommandBuilder()
    .setName("reset_economy")
    .setDescription("経済データをリセットします（管理者専用）"),

  new SlashCommandBuilder()
    .setName("start_economy")
    .setDescription("経済システムを開始します（管理者専用）"),

  new SlashCommandBuilder()
    .setName("set_role_reward")
    .setDescription("特定ロールに自動収入を設定します（管理者専用）")
    .addRoleOption(opt => opt.setName("role").setDescription("ロールを選択").setRequired(true))
    .addIntegerOption(opt => opt.setName("amount").setDescription("付与金額").setRequired(true)),

  new SlashCommandBuilder()
    .setName("set_role_reward_time")
    .setDescription("ロール収入が入る時間を設定します（管理者専用）")
    .addStringOption(opt =>
      opt
        .setName("times")
        .setDescription("時間をカンマ区切りで指定（例: 00:00,08:00,20:00）")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("set_stock_channel")
    .setDescription("株価変動を通知するチャンネルを設定します（管理者専用）")
    .addChannelOption(opt =>
      opt.setName("channel").setDescription("チャンネルを選択").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("create_stock")
    .setDescription("新しい株（会社）を作成します（管理者専用）")
    .addStringOption(opt => opt.setName("name").setDescription("会社名").setRequired(true))
    .addIntegerOption(opt => opt.setName("price").setDescription("初期株価").setRequired(true)),

  new SlashCommandBuilder()
    .setName("buy_stock")
    .setDescription("株を購入します")
    .addStringOption(opt => opt.setName("name").setDescription("会社名").setRequired(true))
    .addIntegerOption(opt => opt.setName("amount").setDescription("株数").setRequired(true)),

  new SlashCommandBuilder()
    .setName("sell_stock")
    .setDescription("株を売却します")
    .addStringOption(opt => opt.setName("name").setDescription("会社名").setRequired(true))
    .addIntegerOption(opt => opt.setName("amount").setDescription("株数").setRequired(true)),
];

// ================================
// 🛰️ コマンド登録処理
// ================================
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🔄 スラッシュコマンドを登録中...");

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands.map(cmd => cmd.toJSON()),
    });

    console.log("✅ コマンド登録完了！");
  } catch (error) {
    console.error("❌ コマンド登録エラー:", error);
  }
})();

