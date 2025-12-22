import {
  SlashCommandBuilder,
  EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

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
        .setDescription("購入株数")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const stockId = interaction.options.getString("id");
    const amount = interaction.options.getInteger("amount");

    const db = await readGuildDB();

    const stock = db[guildId]?.stocks?.[stockId];
    if (!stock) {
      return interaction.reply({
        content: "❌ その株は存在しません。",
        ephemeral: true
      });
    }

    // ユーザーデータ初期化
    if (!db[guildId].users) db[guildId].users = {};
    if (!db[guildId].users[userId]) {
      db[guildId].users[userId] = {
        money: 0,
        stocks: {}
      };
    }

    const user = db[guildId].users[userId];

    const totalPrice = stock.price * amount;

    // 所持金チェック
    if (user.money < totalPrice) {
      return interaction.reply({
        content: `❌ 所持金が足りません。\n必要金額：${totalPrice}`,
        ephemeral: true
      });
    }

    // 購入処理
    user.money -= totalPrice;
    user.stocks[stockId] = (user.stocks[stockId] || 0) + amount;

    await writeGuildDB(db);

    // 埋め込み返信
    const embed = new EmbedBuilder()
      .setColor("#00c853")
      .setTitle("📈 株を購入しました")
      .addFields(
        { name: "会社", value: stock.name, inline: true },
        { name: "株数", value: `${amount} 株`, inline: true },
        { name: "株価", value: `${stock.price}`, inline: true },
        { name: "合計金額", value: `${totalPrice}`, inline: true },
        { name: "残高", value: `${user.money}`, inline: true }
      );

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
