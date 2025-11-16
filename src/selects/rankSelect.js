import { readGuildDB } from "../utils/file.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default async function rankSelectHandler(interaction) {
  const value = interaction.values?.[0] || interaction.customId.split(":")[1];
  const page = parseInt(interaction.customId?.split(":")[2] || "1");
  const guildId = interaction.guild.id;

  const db = await readGuildDB();
  const users = db[guildId]?.users || {};

  // === ランキング対象キー ===
  const key = value === "vxp" ? "vxp" : "xp"; // デフォルト xp

  // === ソート & 分割 ===
  const sorted = Object.entries(users)
    .sort((a, b) => b[1][key] - a[1][key]);

  const pageSize = 10;
  const totalPage = Math.max(1, Math.ceil(sorted.length / pageSize));

  const start = (page - 1) * pageSize;
  const pageUsers = sorted.slice(start, start + pageSize);

  // === Embed 作成 ===
  const embed = new EmbedBuilder()
    .setTitle(key === "xp" ? "🏆 XP ランキング" : "🎤 VXP ランキング")
    .setColor("#00aaff")
    .setFooter({ text: `ページ ${page} / ${totalPage}` });

  let desc = "";
  pageUsers.forEach(([uid, data], i) => {
    const rank = start + i + 1;
    desc += `**${rank}. <@${uid}>** — ${key.toUpperCase()}: ${data[key]}\n`;
  });
  embed.setDescription(desc || "データがありません");

  // === ページボタン ===
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rank:prev:${value}:${page}`)
      .setLabel("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 1),

    new ButtonBuilder()
      .setCustomId(`rank:next:${value}:${page}`)
      .setLabel("▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === totalPage)
  );

  if (interaction.isStringSelectMenu()) {
    return interaction.update({ embeds: [embed], components: [row] });
  }

  if (interaction.isButton()) {
    return interaction.update({ embeds: [embed], components: [row] });
  }
}
