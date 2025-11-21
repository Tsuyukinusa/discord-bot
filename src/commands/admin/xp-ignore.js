import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("xp-ignore")
    .setDescription("XP を加算しないチャンネルを管理します")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("add").setDescription("このチャンネルを XP 除外に追加")
    )
    .addSubcommand((sub) =>
      sub.setName("remove").setDescription("このチャンネルの XP 除外を解除")
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("XP 除外チャンネル一覧を表示")
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const channelId = interaction.channel.id;

    const db = await readGuildDB();
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].xpIgnoreChannels) db[guildId].xpIgnoreChannels = [];
    const arr = db[guildId].xpIgnoreChannels;

    // ===== ADD =====
    if (sub === "add") {
      if (!arr.includes(channelId)) {
        arr.push(channelId);
        await writeGuildDB(db);
      }

      const embed = new EmbedBuilder()
        .setColor(0xff5555)
        .setTitle("🚫 XP除外チャンネルに追加")
        .setDescription(`このチャンネルは **XP除外** に設定されました！`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ===== REMOVE =====
    if (sub === "remove") {
      const i = arr.indexOf(channelId);
      if (i !== -1) {
        arr.splice(i, 1);
        await writeGuildDB(db);
      }

      const embed = new EmbedBuilder()
        .setColor(0x55ff99)
        .setTitle("✅ XP除外解除")
        .setDescription(`このチャンネルは **XP除外解除** されました！`)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    // ===== LIST =====
    if (sub === "list") {
      if (arr.length === 0) {
        const emptyEmbed = new EmbedBuilder()
          .setColor(0x00aaff)
          .setTitle("📭 XP除外チャンネルなし")
          .setDescription("現在、XPが無効化されているチャンネルはありません。")
          .setTimestamp();

        return interaction.reply({ embeds: [emptyEmbed] });
      }

      const channelList = arr.map((id) => `<#${id}>`).join("\n");

      const listEmbed = new EmbedBuilder()
        .setColor(0x00aaff)
        .setTitle("📌 XP除外チャンネル一覧")
        .setDescription(channelList)
        .setTimestamp();

      return interaction.reply({ embeds: [listEmbed] });
    }
  },
};
