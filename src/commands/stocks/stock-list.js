import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";
import { readGuildDB } from "../../utils/file.js";

const PAGE_SIZE = 5;

export default {
  data: new SlashCommandBuilder()
    .setName("stock-list")
    .setDescription("登録されている株の一覧を表示します"),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const db = await readGuildDB();

    const stocks = db[guildId]?.stocks;
    if (!stocks || Object.keys(stocks).length === 0) {
      return interaction.reply("📉 登録されている株はありません。");
    }

    const page = 1;
    const embed = createStockEmbed(stocks, page);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`stock-prev:${page}`)
        .setLabel("◀")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId(`stock-next:${page}`)
        .setLabel("▶")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
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
