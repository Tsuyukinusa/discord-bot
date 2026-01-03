// src/commands/economy/set-income-channel.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("set-income-channel")
    .setDescription("給料が発生するチャンネルとロールを紐付けます")
    .addChannelOption(opt =>
      opt.setName("channel")
        .setDescription("給料対象チャンネル")
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName("role")
        .setDescription("このチャンネルで給料対象になるロール")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("role");

    const db = await readGuildDB();

    if (!db[guildId]?.income?.roles?.[role.id]) {
      return interaction.reply({
        content: "❌ そのロールはまだ給料設定されていません。\n先に `/set-role-income` を使ってください。",
        ephemeral: true
      });
    }

    if (!db[guildId].income.channels) {
      db[guildId].income.channels = {};
    }

    db[guildId].income.channels[channel.id] = role.id;

    await writeGuildDB(db);

    return interaction.reply({
      content: `✅ チャンネル <#${channel.id}> をロール **${role.name}** の給料対象に設定しました`,
      ephemeral: true
    });
  }
};
