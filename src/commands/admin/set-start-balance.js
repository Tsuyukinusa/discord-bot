import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("set-start-balance")
    .setDescription("新規ユーザーの初期所持金を設定します（管理者のみ）")
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("初期所持金（0以上）")
        .setRequired(true)
        .setMinValue(0)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const amount = interaction.options.getInteger("amount");

    const db = await readGuildDB();

    // 🌟 埋め込みメッセージ
    const embed = new EmbedBuilder()
      .setTitle("初期所持金の設定")
      .setDescription(`新規ユーザーの初期所持金を以下の値に設定しました。`)
      .addFields({
        name: "💰 初期所持金",
        value: `**${amount}**`,
        inline: false,
      })
      .setColor("#00b894")
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });
  },
};
