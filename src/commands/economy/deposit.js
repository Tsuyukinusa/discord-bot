import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";
import { getBalance } from "../../services/economyService.js";

export default {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("銀行にお金を預けます")
    .addStringOption(option =>
      option
        .setName("amount")
        .setDescription("預ける金額（数字 or all）")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const amountRaw = interaction.options.getString("amount");

    const db = await readGuildDB();

    // --- ユーザー初期化 ---
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].users) db[guildId].users = {};
    if (!db[guildId].users[userId]) {
      db[guildId].users[userId] = {
        balance: 0,
        bank: 0
      };
    }

    const user = db[guildId].users[userId];
    if (typeof user.bank !== "number") user.bank = 0;
    if (typeof user.balance !== "number") user.balance = 0;

    const balance = user.balance;

    // --- 金額処理 ---
    let amount;
    if (amountRaw === "all") {
      amount = balance;
      if (amount <= 0) {
        return interaction.reply({
          content: "❌ 預けるお金がありません。",
          ephemeral: true
        });
      }
    } else {
      amount = Number(amountRaw);
      if (isNaN(amount) || amount <= 0 || amount > balance) {
        return interaction.reply({
          content: "❌ 金額が不正です。",
          ephemeral: true
        });
      }
    }

    // --- 処理 ---
    user.balance -= amount;
    user.bank += amount;

    await writeGuildDB(db);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏦 入金完了")
          .setColor("#00c3ff")
          .addFields(
            { name: "💰 Wallet", value: `${user.balance}`, inline: true },
            { name: "🏦 Bank", value: `${user.bank}`, inline: true }
          )
          .setTimestamp()
      ]
    });
  }
};
