// src/commands/stocks/stock-sell.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stock-sell")
    .setDescription("株を売却します")
    .addStringOption(o =>
      o.setName("id")
        .setDescription("会社ID")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("amount")
        .setDescription("売却数")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const stockId = interaction.options.getString("id");
    const amount = interaction.options.getInteger("amount");

    const db = await readGuildDB();

    // --- ギルド / ユーザー初期化 ---
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].users) db[guildId].users = {};
    if (!db[guildId].users[userId]) {
      db[guildId].users[userId] = {
        balance: 0,
        bank: 0,
        stocks: {}
      };
    }

    const user = db[guildId].users[userId];

    // --- 株チェック ---
    const stock = db[guildId]?.stocks?.[stockId];
    if (!stock) {
      return interaction.reply({
        content: "❌ その会社は存在しません。",
        ephemeral: true
      });
    }

    if (!user.stocks) user.stocks = {};
    const owned = user.stocks[stockId] || 0;

    if (owned < amount) {
      return interaction.reply({
        content: "❌ 所持している株数が足りません。",
        ephemeral: true
      });
    }

    // --- 売却処理 ---
    const totalPrice = stock.price * amount;

    user.stocks[stockId] -= amount;
    if (user.stocks[stockId] <= 0) {
      delete user.stocks[stockId];
    }

    // ✅ balance に統一
    user.balance += totalPrice;

    await writeGuildDB(db);

    // --- 通貨記号 ---
    const currency =
      db[guildId]?.economy?.currency ?? "💰";

    // --- Embed ---
    const embed = new EmbedBuilder()
      .setColor("#ff5252")
      .setTitle("📉 株式売却完了")
      .addFields(
        { name: "会社", value: stock.name, inline: true },
        { name: "売却数", value: `${amount} 株`, inline: true },
        { name: "株価", value: `${currency}${stock.price}`, inline: true },
        { name: "受取金額", value: `${currency}${totalPrice}`, inline: false },
        { name: "残り保有数", value: `${user.stocks[stockId] || 0} 株`, inline: false },
        { name: "💰 現在の所持金", value: `${currency}${user.balance}`, inline: false }
      )
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
