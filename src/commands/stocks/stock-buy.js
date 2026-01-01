// src/commands/stocks/stock-buy.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stock-buy")
    .setDescription("株を購入します")
    .addStringOption(o =>
      o.setName("id")
        .setDescription("会社ID")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("amount")
        .setDescription("購入数")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const stockId = interaction.options.getString("id");
    const amount = interaction.options.getInteger("amount");

    const db = await readGuildDB();

    // --- 株チェック ---
    const stock = db[guildId]?.stocks?.[stockId];
    if (!stock) {
      return interaction.reply({
        content: "❌ その会社は存在しません。",
        ephemeral: true
      });
    }

    // --- ユーザー初期化 ---
    if (!db[guildId].users) db[guildId].users = {};
    if (!db[guildId].users[userId]) {
      db[guildId].users[userId] = {
        balance: 0,
        bank: 0,
        stocks: {}
      };
    }

    const user = db[guildId].users[userId];
    if (!user.stocks) user.stocks = {};
    if (typeof user.balance !== "number") user.balance = 0;

    const totalCost = stock.price * amount;

    // --- 所持金チェック ---
    if (user.balance < totalCost) {
      return interaction.reply({
        content: `❌ 所持金が足りません。\n必要額: **${totalCost.toLocaleString()}**`,
        ephemeral: true
      });
    }

    // --- 購入処理 ---
    user.balance -= totalCost;
    user.stocks[stockId] = (user.stocks[stockId] || 0) + amount;

    await writeGuildDB(db);

    // --- 通貨 ---
    const currency = db[guildId].currency?.symbol ?? "¥";

    // --- Embed ---
    const embed = new EmbedBuilder()
      .setColor("#4caf50")
      .setTitle("📈 株を購入しました")
      .addFields(
        { name: "会社", value: stock.name, inline: true },
        { name: "購入数", value: `${amount} 株`, inline: true },
        { name: "株価", value: `${currency}${stock.price.toLocaleString()}`, inline: true },
        { name: "支払額", value: `${currency}${totalCost.toLocaleString()}`, inline: false },
        { name: "現在の保有数", value: `${user.stocks[stockId]} 株`, inline: false }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
