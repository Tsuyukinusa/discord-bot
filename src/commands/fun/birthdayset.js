import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser, updateUser } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("birthdayset")
    .setDescription("あなたの誕生日を設定します")
    .addIntegerOption(opt =>
      opt.setName("month")
        .setDescription("誕生月（1〜12）")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(12)
    )
    .addIntegerOption(opt =>
      opt.setName("day")
        .setDescription("誕生日（1〜31）")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(31)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const month = interaction.options.getInteger("month");
    const day = interaction.options.getInteger("day");

    // --- 日付妥当性チェック ---
    const date = new Date(2024, month - 1, day);
    if (
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return interaction.reply({
        content: "❌ 存在しない日付です。",
        ephemeral: true
      });
    }

    const user = getUser(guildId, userId);

    // --- 誕生日保存 ---
    user.birthday = {
      month,
      day
    };

    updateUser(guildId, userId, user);

    // --- Embed ---
    const embed = new EmbedBuilder()
      .setColor("#ff9ad5")
      .setTitle("🎉 誕生日を設定しました！")
      .setDescription(
        `あなたの誕生日は **${month}月${day}日** です！`
      )
      .setFooter({ text: "誕生日当日が楽しみだね 🎂" })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
