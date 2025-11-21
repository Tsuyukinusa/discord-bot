import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readUserDB, writeUserDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("reset-background")
    .setDescription("プロフィールカードの背景をデフォルトに戻します"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const userDB = await readUserDB(userId);

    // 背景をデフォルトへ
    userDB.background = null;
    await writeUserDB(userId, userDB);

    // 埋め込み返信
    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle("🧹 背景をリセットしました")
      .setDescription("プロフィールカードの背景をデフォルトに戻しました！")
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};
