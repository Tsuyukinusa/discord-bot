// src/commands/leveling/profile-reset.js
import { SlashCommandBuilder } from "discord.js";
import { readUserDB, writeUserDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("profile-reset")
    .setDescription("プロフィールカードの設定をすべてリセットします"),

  async execute(interaction) {
    const userId = interaction.user.id;

    // 現在のDBを読み込み
    const userDB = readUserDB(userId);

    // プロフィール設定が存在しない場合
    if (!userDB.profile) {
      return interaction.reply({
        content: "⚠ リセットするプロフィール設定がありません。",
        ephemeral: true,
      });
    }

    // プロフィール部分を削除
    delete userDB.profile;

    // 保存
    writeUserDB(userId, userDB);

    return interaction.reply({
      content: "🔄 **
