// src/selects/rankSelect.js
import { readGuildDB } from "../utils/file.js";
import { createProfileCard } from "../services/profileService.js";
import { AttachmentBuilder, EmbedBuilder } from "discord.js";

export default async function rankSelectHandler(interaction) {
  const value = interaction.values[0];
  const guildId = interaction.guild.id;

  // ===== XP ランキング =====
  if (value === "xp") {
    const db = await readGuildDB();
    const users = db[guildId]?.users || {};

    const sorted = Object.entries(users)
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle("🏆 XP ランキング TOP10")
      .setColor("#00bfff");

    let rankText = "";
    sorted.forEach(([uid, data], i) => {
      rankText += `**${i + 1}. <@${uid}>** - XP: ${data.xp}\n`;
    });

    embed.setDescription(rankText || "データがありません");

    return interaction.update({ embeds: [embed], components: [] });
  }

  // ===== VXP ランキング =====
  if (value === "vxp") {
    const db = await readGuildDB();
    const users = db[guildId]?.users || {};

    const sorted = Object.entries(users)
      .sort((a, b) => b[1].vxp - a[1].vxp)
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle("🎤 VXP ランキング TOP10")
      .setColor("#ff7f50");

    let rankText = "";
    sorted.forEach(([uid, data], i) => {
      rankText += `**${i + 1}. <@${uid}>** - VXP: ${data.vxp}\n`;
    });

    embed.setDescription(rankText || "データがありません");

    return interaction.update({ embeds: [embed], components: [] });
  }

  // ===== プロフィール表示 =====
  if (value === "profile") {
    await interaction.deferUpdate();

    const buffer = await createProfileCard(
      interaction.guild.id,
      interaction.user
    );

    const attachment = new AttachmentBuilder(buffer, {
      name: "profile.png",
    });

    return interaction.editReply({ files: [attachment], components: [] });
  }
}
