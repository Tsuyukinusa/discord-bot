// src/commands/admin/setdaily.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setdaily")
    .setDescription("Dailyボーナスを設定します")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(o =>
      o.setName("amount")
       .setDescription("毎日の支給額")
       .setRequired(true)
    )
    .addRoleOption(o =>
      o.setName("role")
       .setDescription("付与するロール（任意）")
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const amount = interaction.options.getInteger("amount");
    const role = interaction.options.getRole("role");

    const db = await readGuildDB();
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].daily) db[guildId].daily = {};

    db[guildId].daily = {
      enabled: true,
      amount,
      roleId: role?.id ?? null,
      lastRun: null
    };

    await writeGuildDB(db);

    return interaction.reply({
      content:
        `✅ Daily設定完了\n` +
        `💰 金額: ${amount}\n` +
        `🎭 ロール: ${role ? role.name : "なし"}`,
      ephemeral: true
    });
  }
};
