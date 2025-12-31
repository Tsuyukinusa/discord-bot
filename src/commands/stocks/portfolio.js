
// commands/stocks/portfolio.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("portfolio")
    .setDescription("あなたの保有している株一覧を表示します"),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const db = await readGuildDB();
    const user = db[guildId]?.users?.[userId];
    const stocks = db[guildId]?.stocks;
    const currency = db[guildId]?.currencySymbol || "💰";

    if (!user || !user.stocks || Object.keys(user.stocks).length === 0) {
      return interaction.reply({
        content: "📭 あなたはまだ株を保有していません。",
        ephemeral: true
      });
    }

    let description = "";
    let totalValue = 0;

    for (const stockId in user.stocks) {
      const amount = user.stocks[stockId];
      const stock = stocks?.[stockId];
      if (!stock) continue;

      const value = stock.price * amount;
      totalValue += value;

      description += `**${stock.name}** (${stockId})\n`
        + `📦 保有数: ${amount}\n`
        + `💹 現在価格: ${currency}${stock.price}\n`
        + `💰 評価額: ${currency}${value}\n\n`;
    }

    const embed = new EmbedBuilder()
      .setColor("#4caf50")
      .setTitle(`📊 ${interaction.user.username} のポートフォリオ`)
      .setDescription(description)
      .addFields({
        name: "📈 総評価額",
        value: `${currency}${totalValue}`,
      })
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      ephemeral: false // みんなに見える（変えたければ true）
    });
  }
};
