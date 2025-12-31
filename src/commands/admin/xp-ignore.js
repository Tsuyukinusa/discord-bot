import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("xp-ignore")
    .setDescription("XP を加算しないチャンネルを管理します")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("XP 除外チャンネルを追加")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("XPを除外したいチャンネル")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("XP 除外チャンネルを解除")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("XP除外を解除したいチャンネル")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("XP 除外チャンネル一覧を表示")
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    const db = await readGuildDB();
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].xpIgnoreChannels) db[guildId].xpIgnoreChannels = [];

    const arr = db[guildId].xpIgnoreChannels;

    // ======================
    // ADD
    // ======================
    if (sub === "add") {
      const channel = interaction.options.getChannel("channel");

      if (!arr.includes(channel.id)) {
        arr.push(channel.id);
        await writeGuildDB(db);
      }

      return interaction.reply(
        `🚫 <#${channel.id}> を **XP除外** に追加しました！`
      );
    }

    // ======================
    // REMOVE
    // ======================
    if (sub === "remove") {
      const channel = interaction.options.getChannel("channel");

      const i = arr.indexOf(channel.id);
      if (i !== -1) {
        arr.splice(i, 1);
        await writeGuildDB(db);
      }

      return interaction.reply(
        `✅ <#${channel.id}> の **XP除外を解除** しました！`
      );
    }

    // ======================
    // LIST
    // ======================
    if (sub === "list") {
      if (arr.length === 0) {
        return interaction.reply("📭 **XP除外チャンネルはありません！**");
      }

      const channelList = arr.map((id) => `<#${id}>`).join("\n");
      return interaction.reply(
        `📌 **XP が加算されないチャンネル一覧：**\n${channelList}`
      );
    }
  },
};
