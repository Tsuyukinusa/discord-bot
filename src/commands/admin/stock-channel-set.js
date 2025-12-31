// commands/admin/stock-channel-set.js
import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stock-channel-set")
    .setDescription("株価変動の通知チャンネルを設定します")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(o =>
      o.setName("channel")
        .setDescription("通知チャンネル")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const channel = interaction.options.getChannel("channel");

    const db = await readGuildDB();
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].stockConfig) db[guildId].stockConfig = { updateTimes: [] };

    db[guildId].stockConfig.announceChannel = channel.id;
    await writeGuildDB(db);

    const embed = new EmbedBuilder()
      .setTitle("📢 通知チャンネル設定")
      .setColor("#ffd43b")
      .setDescription(`${channel} に通知します`);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
