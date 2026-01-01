import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { buyStock } from "../../Services/stockServices.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stock-buy")
    .setDescription("株を購入します")
    .addStringOption(o =>
      o.setName("id").setDescription("株ID").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("amount").setDescription("購入数").setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const id = interaction.options.getString("id");
    const amount = interaction.options.getInteger("amount");

    try {
      await buyStock(guildId, userId, id, amount);
    } catch (e) {
      return interaction.reply({
        content: "❌ 購入に失敗しました",
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("📈 株購入完了")
          .setDescription(`${id} を ${amount} 株購入しました`)
      ]
    });
  }
};
