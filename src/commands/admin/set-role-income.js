// src/commands/economy/set-role-income.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("set-role-income")
    .setDescription("リアクション給料が発生するロールを設定します")
    .addRoleOption(opt =>
      opt.setName("role")
        .setDescription("給料対象のロール")
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName("amount")
        .setDescription("リアクション1個あたりの給料")
        .setMinValue(1)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const role = interaction.options.getRole("role");
    const amount = interaction.options.getInteger("amount");

    const db = await readGuildDB();

    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].income) db[guildId].income = {};
    if (!db[guildId].income.roles) db[guildId].income.roles = {};

    db[guildId].income.roles[role.id] = {
      payPerReaction: amount
    };

    await writeGuildDB(db);

    return interaction.reply({
      content: `✅ ロール **${role.name}** を給料対象に設定しました\n💰 1リアクション = **${amount}**`,
      ephemeral: true
    });
  }
};
