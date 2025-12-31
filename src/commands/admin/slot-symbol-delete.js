// src/commands/gambling/slot-symbol-delete.js
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("slot-symbol-delete")
    .setDescription("スロットのシンボルを削除します")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName("emoji")
        .setDescription("削除する絵文字（登録済み）")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const emoji = interaction.options.getString("emoji");

    const db = await readGuildDB();

    if (!db[guildId] || !db[guildId].slotSymbols) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ スロットのシンボルがまだ登録されていません")
        ],
        ephemeral: true
      });
    }

    const before = db[guildId].slotSymbols.length;

    db[guildId].slotSymbols =
      db[guildId].slotSymbols.filter(s => s.emoji !== emoji);

    if (db[guildId].slotSymbols.length === before) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Orange")
            .setDescription(`⚠️ ${emoji} は登録されていません`)
        ],
        ephemeral: true
      });
    }

    await writeGuildDB(db);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("🗑️ シンボル削除")
          .setDescription(`${emoji} を削除しました`)
      ]
    });
  }
};
