// commands/admin/stock-time-remove.js
import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stock-time-remove")
    .setDescription("株価変動時間を削除します（管理者専用）")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName("time")
        .setDescription("削除する時間（HH:MM）")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const time = interaction.options.getString("time");

    const db = await readGuildDB();
    const config = db[guildId]?.stockConfig;

    if (!config || !config.updateTimes.includes(time)) {
      return interaction.reply({ content: "❌ その時間は登録されていません。", ephemeral: true });
    }

    config.updateTimes = config.updateTimes.filter(t => t !== time);

    await writeGuildDB(db);

    const embed = new EmbedBuilder()
      .setColor("#ff6b6b")
      .setTitle("🗑️ 株価変動時間 削除")
      .setDescription(`**${time}** を削除しました。`)
      .addFields({
        name: "残りの設定",
        value: config.updateTimes.length ? config.updateTimes.join(", ") : "（なし）"
      });

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
