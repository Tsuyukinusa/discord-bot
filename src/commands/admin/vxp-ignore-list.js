import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from "discord.js";
import { readGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("vxp-ignore-list")
    .setDescription("VXPが増えないチャンネル一覧を表示します")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const guildDB = await readGuildDB();
    const list = guildDB[guildId]?.vxpIgnoreChannels || [];

    // ❌ 除外がない場合
    if (list.length === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle("📭 除外チャンネルなし")
        .setDescription("現在、VXP が加算されないチャンネルはありません。")
        .setTimestamp();

      return interaction.reply({
        embeds: [emptyEmbed],
        ephemeral: true,
      });
    }

    // ✔ 除外リスト表示
    const formatted = list.map(id => `• <#${id}>`).join("\n");

    const listEmbed = new EmbedBuilder()
      .setColor(0x55aaff)
      .setTitle("📌 VXP除外チャンネル一覧")
      .setDescription(formatted)
      .setTimestamp();

    return interaction.reply({
      embeds: [listEmbed],
      ephemeral: false,
    });
  },
};
