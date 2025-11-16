// src/selects/rankSelect.js
import { readGuildDB } from "../utils/file.js";
import { EmbedBuilder } from "discord.js";
import { getUserLevel } from "../services/levelingService.js";

export default async function rankSelectHandler(interaction) {
  const value = interaction.values[0];
  const guildId = interaction.guild.id;

  // -----------------------------
  // 📌 自分のステータス（me）
  // -----------------------------
  if (value === "me") {
    const userId = interaction.user.id;
    const data = await getUserLevel(guildId, userId);

    if (!data) {
      return interaction.reply({
        content: "⚠ データがありません！先にXPかVXPを獲得してください。",
        ephemeral: true,
      });
    }

    const { xp, level, vxp, vlevel } = data;

    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setAuthor({
        name: `${interaction.user.username} さんのステータス`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .addFields(
        {
          name: "📘 テキスト",
          value: `Level: **${level}**\nXP: **${xp} / ${level * 100}**`,
          inline: true,
        },
        {
          name: "🎤 ボイス",
          value: `VLevel: **${vlevel}**\nVXP: **${vxp} / ${vlevel * 100}**`,
          inline: true,
        }
      );

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // -----------------------------
  // 📌 XP / VXP ランキング処理（既存）
  // -----------------------------
  const db = await readGuildDB();
  const users = db[guildId]?.users || {};

  // 指定されたキーごとにランキング作成
  const key = value === "xp" ? "xp" : "vxp";

  const sorted = Object.entries(users)
    .sort((a, b) => b[1][key] - a[1][key])
    .slice(0, 10);

  const embed = new EmbedBuilder()
    .setColor(0xffcc00)
    .setTitle(value === "xp" ? "🏆 XP ランキング" : "🎤 VXP ランキング");

  let desc = "";
  for (let i = 0; i < sorted.length; i++) {
    const [userId, data] = sorted[i];
    desc += `**${i + 1}位** <@${userId}> — ${key.toUpperCase()}: **${data[key]}**\n`;
  }

  embed.setDescription(desc || "データがありません。");

  return interaction.reply({ embeds: [embed] });
}
