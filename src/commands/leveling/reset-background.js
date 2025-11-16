// src/commands/leveling/reset-background.js
import { SlashCommandBuilder } from "discord.js";
import { readUserDB, writeUserDB } from "../../utils/userDB.js";

export default {
  data: new SlashCommandBuilder()
    .setName("reset-background")
    .setDescription("プロフィールカードの背景をデフォルトに戻します"),

  async execute(interaction) {
    const userId = interaction.user.id;

    const userDB = await readUserDB(userId);

    userDB.background = null; // デフォルトに戻す

    await writeUserDB(userId, userDB);

    await interaction.reply({
      content: "🧹 背景をデフォルトに戻しました！",
      ephemeral: true,
    });
  },
};
