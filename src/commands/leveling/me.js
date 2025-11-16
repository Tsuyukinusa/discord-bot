// src/commands/leveling/me.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getUserLevel } from "../../services/levelingService.js";

export default {
  data: new SlashCommandBuilder()
    .setName("me")
    .setDescription("あなたのレベル・XP・VXP ステータスを表示します"),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const data = await getUserLevel(guildId, userId);

    if (!data) {
      return interaction.reply({
        content: "⚠ まだデータがありません！メッセージかVCでXPを獲得してください。",
        ephemeral: true,
      });
    }

    const { xp, level, vxp, vlevel } = data;

    const nextXP = level * 100;
    const nextVXP = vlevel * 100;

    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setAuthor({
        name: `${interaction.user.username} さんのステータス`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields(
        {
          name: "📘 テキストレベル",
          value: `Level: **${level}**\nXP: **${xp} / ${nextXP}**`,
          inline: true,
        },
        {
          name: "🎤 ボイスレベル",
          value: `VLevel: **${vlevel}**\nVXP: **${vxp} / ${nextVXP}**`,
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
