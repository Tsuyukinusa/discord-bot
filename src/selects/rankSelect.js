import { readGuildDB } from "../utils/file.js";
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export default async function rankSelectHandler(interaction) {
  let key = null;
  let page = 1;

  if (interaction.isStringSelectMenu()) key = interaction.values[0];
  else if (interaction.isButton()) {
    const parts = interaction.customId.split(":");
    key = parts[2];
    const nowPage = parseInt(parts[3]);
    page = parts[1] === "next" ? nowPage + 1 : nowPage - 1;
  }

  const guildId = interaction.guild.id;
  const db = await readGuildDB();
  const users = db[guildId]?.users || {};

  const sorted = Object.entries(users).sort((a, b) => b[1][key] - a[1][key]);
  const pageSize = 10;
  const totalPage = Math.max(1, Math.ceil(sorted.length / pageSize));
  page = Math.min(Math.max(page, 1), totalPage);
  const slice = sorted.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

  const embed = new EmbedBuilder()
    .setTitle(key === "xp" ? "🏆 XP ランキング" : "🎤 VXP ランキング")
    .setColor("#00aaff")
    .setFooter({ text: `ページ ${page} / ${totalPage}` });

  embed.setDescription(slice.map(([uid, data], i) => `**${(page - 1) * pageSize + i + 1}. <@${uid}>** — ${key.toUpperCase()}: ${data[key]}`).join("\n") || "データがありません");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rank:prev:${key}:${page}`)
      .setLabel("◀")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 1),
    new ButtonBuilder()
      .setCustomId(`rank:next:${key}:${page}`)
      .setLabel("▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === totalPage)
  );

  return interaction.update({ embeds: [embed], components: [row] });
}
