import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("vxp-ignore-remove")
    .setDescription("VXP除外チャンネルを解除します")
    .addChannelOption(opt =>
      opt.setName("channel")
        .setDescription("除外から外すチャンネル")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guild.id;

    const guildDB = await readGuildDB();
    guildDB[guildId] ||= {};
    guildDB[guildId].vxpIgnoreChannels ||= [];

    const list = guildDB[guildId].vxpIgnoreChannels;

    // ❌ まだ除外されてなかった場合
    if (!list.includes(channel.id)) {
      const notFoundEmbed = new EmbedBuilder()
        .setColor(0xff4444)
        .setTitle("⚠ 除外されていません")
        .setDescription(`<#${channel.id}> は VXP 除外リストにありません。`)
        .setTimestamp();

      return interaction.reply({
        embeds: [notFoundEmbed],
        ephemeral: true,
      });
    }

    // ✔ 除外リストから削除
    guildDB[guildId].vxpIgnoreChannels = list.filter(id => id !== channel.id);
    await writeGuildDB(guildDB);

    const successEmbed = new EmbedBuilder()
      .setColor(0x55ff99)
      .setTitle("🗑️ 除外解除しました")
      .setDescription(`<#${channel.id}> を **VXP 除外リスト** から削除しました！`)
      .setTimestamp();

    return interaction.reply({
      embeds: [successEmbed],
      ephemeral: true,
    });
  },
};
