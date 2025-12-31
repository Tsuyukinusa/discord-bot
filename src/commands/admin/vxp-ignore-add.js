import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("vxp-ignore-add")
    .setDescription("VXPが増えないチャンネルを追加します")
    .addChannelOption(opt =>
      opt
        .setName("channel")
        .setDescription("除外する VC（ボイスチャット）チャンネルを選択")
        .addChannelTypes(ChannelType.GuildVoice) // ← VC のみ選択可能！
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guild.id;

    const guildDB = await readGuildDB();
    guildDB[guildId] ||= {};
    guildDB[guildId].vxpIgnoreChannels ||= [];

    // すでに除外されている場合
    if (guildDB[guildId].vxpIgnoreChannels.includes(channel.id)) {
      const alreadyEmbed = new EmbedBuilder()
        .setColor(0xffaa00)
        .setTitle("⚠ すでに登録済み")
        .setDescription(`<#${channel.id}> は **すでに VXP除外チャンネル** に設定されています。`)
        .setTimestamp();

      return interaction.reply({
        embeds: [alreadyEmbed],
        ephemeral: true,
      });
    }

    // 新規追加
    guildDB[guildId].vxpIgnoreChannels.push(channel.id);
    await writeGuildDB(guildDB);

    const addedEmbed = new EmbedBuilder()
      .setColor(0x55dd77)
      .setTitle("✅ VXP除外に追加しました")
      .setDescription(`<#${channel.id}> を **VXP除外チャンネル** に設定しました！`)
      .setTimestamp();

    return interaction.reply({
      embeds: [addedEmbed],
      ephemeral: true,
    });
  },
};
