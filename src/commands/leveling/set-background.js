import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
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

    // URLチェック
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff5555)
        .setTitle("❌ 無効な URL")
        .setDescription("有効な画像 URL を入力してください。");

      return interaction.reply({
        embeds: [errorEmbed],
        ephemeral: true,
      });
    }

    // DB
    const userDB = await readUserDB(userId);
    if (!userDB.profile) userDB.profile = {};
    userDB.profile.background = url;
    await writeUserDB(userId, userDB);

    // 成功埋め込み
    const successEmbed = new EmbedBuilder()
      .setColor(0x55ff99)
      .setTitle("✅ 背景画像を設定しました！")
      .setDescription(`以下の画像が背景として設定されました：\n${url}`)
      .setImage(url)
      .setTimestamp();

    return interaction.reply({
      embeds: [successEmbed],
      ephemeral: false,
    });
  },
};
