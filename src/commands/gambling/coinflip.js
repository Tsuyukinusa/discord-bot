// commands/gamble/coinflip.js
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { playCoinflip } from "../../utils/gamble/coinflipCore.js";

export default {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("コイン投げでギャンブル")
    .addIntegerOption(o =>
      o.setName("bet").setDescription("賭け金").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("choice")
        .setDescription("表か裏")
        .addChoices(
          { name: "表", value: "heads" },
          { name: "裏", value: "tails" }
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");
    const choice = interaction.options.getString("choice");

    const result = playCoinflip({
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      bet,
      choice
    });

    if (result.error) {
      return interaction.reply({ content: result.error, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("🪙 コイン投げ")
      .setDescription(
        `結果: **${result.result}**\n` +
        (result.win ? "🎉 勝ち！" : "💀 負け…")
      )
      .addFields({
        name: "現在の所持金",
        value: `${result.money}`
      });

    await interaction.reply({ embeds: [embed] });
  }
};
