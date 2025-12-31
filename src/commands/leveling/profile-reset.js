import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readUserDB, writeUserDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("profile-reset")
    .setDescription("プロフィールカードの設定をすべてリセットします"),

  async execute(interaction) {
    const userId = interaction.user.id;

    const userDB = await readUserDB(userId);

    // リセット対象なし
    if (!userDB.profile) {
      const noDataEmbed = new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle("⚠ リセットできる設定がありません")
        .setDescription("プロフィールカードの設定が見つかりませんでした。")
        .setTimestamp();

      return interaction.reply({
        embeds: [noDataEmbed],
        ephemeral: true,
      });
    }

    // リセット処理
    delete userDB.profile;
    await writeUserDB(userId, userDB);

    const successEmbed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle("🔄 プロフィール設定をリセットしました！")
      .setDescription("プロフィールカードの全設定を初期状態に戻しました。")
      .setTimestamp();

    return interaction.reply({
      embeds: [successEmbed],
      ephemeral: true,
    });
  },
};
