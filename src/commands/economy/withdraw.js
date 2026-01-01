// src/commands/economy/withdraw.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("withdraw")
    .setDescription("銀行から引き出します")
    .addStringOption(o =>
      o.setName("amount").setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const raw = interaction.options.getString("amount");

    const db = await readGuildDB();
    const user = db[guildId].users[userId];

    let amount = raw === "all" ? user.bank : Number(raw);
    if (!amount || amount <= 0 || amount > user.bank) {
      return interaction.reply({ content: "❌ 金額が不正です", ephemeral: true });
    }

    user.bank -= amount;
    user.balance += amount;
    await writeGuildDB(db);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏧 引き出し完了")
          .setDescription(`💸 ${amount.toLocaleString()} 引き出しました`)
      ]
    });
  }
};
