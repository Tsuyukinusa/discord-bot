// src/buttons/rankPageButton.js
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";

import { getAllUsers } from "../utils/core/file.js";

export default async function rankPageButtonHandler(interaction) {
  const guildId = interaction.guild.id;

  // customId: rank-prev:1 / rank-next:2
  const [action, currentPage] = interaction.customId.split(":");
  let page = Number(currentPage);

  if (action === "rank-prev") page--;
  if (action === "rank-next") page++;

  // --- 全ユーザー取得 ---
  const all = getAllUsers()[guildId] || {};

  const usersArray = Object.entries(all).map(([id, data]) => ({
    id,
    total: (data.money || 0) + (data.bank || 0),
  }));

  // --- 降順ソート ---
  usersArray.sort((a, b) => b.total - a.total);

  const perPage = 10;
  const maxPage = Math.max(1, Math.ceil(usersArray.length / perPage));

  // ページ範囲ガード
  if (page < 1) page = 1;
  if (page > maxPage) page = maxPage;

  const show = usersArray.slice(
    (page - 1) * perPage,
    page * perPage
  );

  // --- embed ---
  const embed = new EmbedBuilder()
    .setTitle("🏆 資産ランキング - Leaderboard")
    .setColor(0xffcc00)
    .setFooter({ text: `ページ ${page} / ${maxPage}` })
    .setDescription(
      show.length === 0
        ? "ランキングデータがありません。"
        : show
            .map((u, i) => {
              const rank = (page - 1) * perPage + i + 1;
              return `**${rank}位** <@${u.id}> — 💰 **${u.total.toLocaleString()}**`;
            })
            .join("\n")
    );

  // --- buttons ---
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rank-prev:${page}`)
      .setLabel("◀")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 1),

    new ButtonBuilder()
      .setCustomId(`rank-next:${page}`)
      .setLabel("▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= maxPage)
  );

  await interaction.update({
    embeds: [embed],
    components: [row],
  });
}
