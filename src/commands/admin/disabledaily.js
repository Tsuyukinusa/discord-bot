// src/commands/admin/disabledaily.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("disabledaily")
    .setDescription("Dailyボーナスを無効化します")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const db = await readGuildDB();
    const guildId = interaction.guild.id;

    if (db[guildId]?.daily) {
      db[guildId].daily.enabled = false;
      await writeGuildDB(db);
    }

    return interaction.reply({
      content: "🚫 Dailyボーナスを無効化しました",
      ephemeral: true
    });
  }
};
