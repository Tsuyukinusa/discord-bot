import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("set-currency")
    .setDescription("サーバーの通貨記号を設定します（管理者のみ）")
    .addStringOption(option =>
      option
        .setName("symbol")
        .setDescription("設定したい通貨記号（絵文字も可）")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const symbol = interaction.options.getString("symbol");

    const db = await readGuildDB();
