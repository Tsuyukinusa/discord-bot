import { SlashCommandBuilder } from "discord.js";
import { readUserDB, writeUserDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("profile-reset")
    .setDescription("プロフィールカードの設定をすべてリセットします"),

  async execute(interaction) {
    const userId = interaction.user.id;

    const userDB = await readUserDB(userId);

    if (!userDB.profile) {
      return interaction.reply({
        content: "⚠ リセットするプロフィール設定がありません。",
        ephemeral: true,
      });
    }

    delete userDB.profile;
    await writeUserDB(userId, userDB);

    return interaction.reply({
      content: "🔄 プロフィール設定をリセットしました！",
      ephemeral: true,
    });
  },
};
