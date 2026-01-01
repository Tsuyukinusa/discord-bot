import { EmbedBuilder } from "discord.js";
import { getAllUsers } from "../core/file.js";

export function buildLeaderboardEmbed(guildId, page = 1, perPage = 10) {
  const all = getAllUsers()[guildId] || {};

  const usersArray = Object.entries(all).map(([id, data]) => ({
    id,
    total: (data.money || 0) + (data.bank || 0),
  }));

  usersArray.sort((a, b) => b.total - a.total);

  const maxPage = Math.max(1, Math.ceil(usersArray.length / perPage));
  page = Math.min(Math.max(page, 1), maxPage);

  const show = usersArray.slice((page - 1) * perPage, page * perPage);

  const embed = new EmbedBuilder()
    .setTitle("🏆 資産ランキング")
    .setColor(0xffcc00)
    .setFooter({ text: `ページ ${page} / ${maxPage}` })
    .setDescription(
      show.length
        ? show.map((u, i) =>
            `**${(page - 1) * perPage + i + 1}位** <@${u.id}> — 💰 ${u.total.toLocaleString()}`
          ).join("\n")
        : "ランキングデータがありません"
    );

  return { embed, page, maxPage };
}
