import {
  SlashCommandBuilder,
  EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

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

    const id = interaction.options.getString("id");
    const amount = interaction.options.getInteger("amount");

    const db = await readGuildDB();
    const stock = db[guildId]?.stocks?.[id];
    const user = db[guildId]?.users?.[userId];

    if (!stock) {
      return interaction.reply({
        content: "❌ その株は存在しません。",
        ephemeral: true
      });
    }

    if (!user || !user.stocks[id] || user.stocks[id] < amount) {
      return interaction.reply({
        content: "❌ 売却できる株を持っていません。",
        ephemeral: true
      });
    }

    const totalPrice = stock.price * amount;

    // 💰 処理
    user.stocks[id] -= amount;
    user.money += totalPrice;

    if (user.stocks[id] <= 0) delete user.stocks[id];

    await writeGuildDB(db);

    const embed = new EmbedBuilder()
      .setColor("#f44336")
      .setTitle("📉 株を売却しました")
      .addFields(
        { name: "会社", value: stock.name },
        { name: "売却数", value: `${amount}株`, inline: true },
        { name: "株価", value: `${stock.price}`, inline: true },
        { name: "獲得金額", value: `${totalPrice}`, inline: true }
      );

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
