import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUser } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("自分や他人の誕生日を確認します")
    .addUserOption(opt =>
      opt.setName("user")
        .setDescription("確認したいユーザー（省略すると自分）")
        .setRequired(false)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const targetUser =
      interaction.options.getUser("user") ?? interaction.user;

    const userData = getUser(guildId, targetUser.id);

    if (!userData.birthday) {
      return interaction.reply({
        content: `❌ **${targetUser.username}** さんの誕生日は設定されていません。`,
        ephemeral: true
      });
    }

    const { month, day } = userData.birthday;

    const embed = new EmbedBuilder()
      .setColor("#ffb703")
      .setTitle("🎂 誕生日情報")
      .setDescription(
        `**${targetUser.username}** さんの誕生日は\n\n🎉 **${month}月${day}日** です！`
      )
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
