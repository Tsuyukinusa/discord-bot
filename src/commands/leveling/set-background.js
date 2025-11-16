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

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return interaction.reply({
        content: "❌ 有効な画像 URL を入力してください。",
        ephemeral: true,
      });
    }

    const userDB = await readUserDB(userId);
    if (!userDB.profile) userDB.profile = {};
    userDB.profile.background = url;

    await writeUserDB(userId, userDB);

    return interaction.reply({
      content: `✅ 背景画像を設定しました！\nURL: ${url}`,
      ephemeral: false,
    });
  },
};
