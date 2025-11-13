import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("働いてお金を稼ぎます！"),
  async execute(interaction) {
    const earnings = Math.floor(Math.random() * 500) + 100; // 100〜600の間
    await interaction.reply(`💼 ${earnings}💰稼ぎました！`);
  },
};
