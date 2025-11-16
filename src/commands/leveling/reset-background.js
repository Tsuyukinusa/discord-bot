import { SlashCommandBuilder } from "discord.js";
import { readUserDB, writeUserDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("reset-background")
    .setDescription("プロフィールカードの背景をデフォルトに戻します"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const userDB = await readUserDB(userId);

    userDB.background = null;
    await writeUserDB(userId, userDB);

    await interaction.reply({
      content: "🧹 背景をデフォルトに戻しました！",
      ephemeral: true,
    });
  },
};
