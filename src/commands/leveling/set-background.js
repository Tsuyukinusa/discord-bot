// src/commands/leveling/set-background.js
import { SlashCommandBuilder } from "discord.js";
import { readUserDB, writeUserDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("set-background")
    .setDescription("プロフィールカードの背景画像を設定します")
    .addStringOption(option =>
      option
        .setName("url")
        .setDescription("背景画像の URL を入力してください")
        .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString("url");
    const userId = interaction.user.id;

    // URL の簡易チェック
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return interaction.reply({
        content: "❌ 有効な画像 URL を入力してください。",
        ephemeral: true,
      });
    }

    // DB読み込み
    const userDB = readUserDB(userId);

    // プロフィール設定がない場合は作る
    if (!userDB.profile) {
      userDB.profile = {};
    }

    userDB.profile.background = url;

    // 保存
    writeUserDB(userId, userDB);

    return interaction.reply({
      content: `✅ 背景画像を設定しました！\nURL: ${url}`,
      ephemeral: false,
    });
  },
};
