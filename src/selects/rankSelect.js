// src/selects/rankSelect.js
import { readGuildDB } from "../utils/file.js";
import { createProfileCard } from "../services/profileService.js";
import {
  AttachmentBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export default async function rankSelectHandler(interaction) {
  const value = interaction.values[0];
  const guildId = interaction.guild.id;

  // ===========================================
  // 🏆 XP ランキング
  // ===========================================
  if (value === "xp") {
    const db = await readGuildDB();
    const users = db[guildId]?.users || {};

    const sorted = Object.entries(users)
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle("🏆 XP ランキング TOP10")
      .setColor("#00bfff");

    let text = "";
    sorted.forEach(([uid, data], i) => {
      text += `**${i + 1}. <@${uid}>** - XP: ${data.xp}\n`;
    });

    embed.setDescription(text || "データがありません");

    return interaction.update({ embeds: [embed], components: [] });
  }

  // ===========================================
  // 🎤 VXP ランキング
  // ===========================================
  if (value === "vxp") {
    const db = await readGuildDB();
    const users = db[guildId]?.users || {};

    const sorted = Object.entries(users)
      .sort((a, b) => b[1].vxp - a[1].vxp)
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle("🎤 VXP ランキング TOP10")
      .setColor("#ff7f50");

    let text = "";
    sorted.forEach(([uid, data], i) => {
      text += `**${i + 1}. <@${uid}>** - VXP: ${data.vxp}\n`;
    });

    embed.setDescription(text || "データがありません");

    return interaction.update({ embeds: [embed], components: [] });
  }

  // ===========================================
  // 🧑 プロフィール表示 +（B & C対応）背景変更ボタン付き
  // ===========================================
  if (value === "profile") {
    await interaction.deferUpdate();

    const buf = await createProfileCard(guildId, interaction.user);

    const card = new AttachmentBuilder(buf, { name: "profile.png" });

    // ====== B & C：背景を変更・リセットするボタン ======
    const btns = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("set-bg")
        .setLabel("背景を変更")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("reset-bg")
        .setLabel("背景をリセット")
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.editReply({
      files: [card],
      components: [btns],
    });
  }
}
