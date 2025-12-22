import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";
import { readGuildDB } from "../utils/file.js";

const PAGE_SIZE = 5;

export default {
  customId: /^stock-(prev|next):\d+$/,

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const db = await readGuildDB();
    const stocks = db[guildId]?.stocks;

    if (!stocks) {
      return interaction.update({ content: "❌ 株データがありません。", components: [] });
    }

    const [action, currentPage] = interaction.customId.split(":");
    let page = Number(currentPage);

    if (action === "stock-prev") page--;
    if (action === "stock-next") page++;

    const entries = Object.entries(stocks);
    const maxPage = Math.ceil(entries.length / PAGE_SIZE);

    if (page < 1) page = 1;
    if (page > maxPage) page = maxPage;

    const embed = createStockEmbed(stocks, page);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`stock-prev:${page}`)
        .setLabel("◀")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page <= 1),

      new ButtonBuilder()
        .setCustomId(`stock-next:${page}`)
        .setLabel("▶")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page >= maxPage)
    );

    await interaction.update({
      embeds: [embed],
      components: [row]
    });
  }
};

function createStockEmbed(stocks, page) {
  const entries = Object.entries(stocks);
  const start = (page - 1) * PAGE_SIZE;
  const sliced = entries.slice(start, start + PAGE_SIZE);

  const desc = sliced.map(([id, s]) =>
    `**${s.name}**\n変動率: ${s.rate}%`
  ).join("\n\n");

  return new EmbedBuilder()
    .setTitle(`📊 株一覧（ページ ${page}）`)
    .setDescription(desc)
    .setColor("Green");
}
