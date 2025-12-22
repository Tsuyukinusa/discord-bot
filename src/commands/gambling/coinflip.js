import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { playCoinflip } from "../../utils/gamble/coinflipCore.js";

export default {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("コイン投げギャンブル")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("賭け金")
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(o =>
      o.setName("choice")
        .setDescription("表か裏")
        .setRequired(true)
        .addChoices(
          { name: "表", value: "heads" },
          { name: "裏", value: "tails" }
        )
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
      return interaction.reply({
        content: `❌ ${result.error}`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(result.win ? "#4caf50" : "#f44336")
      .setTitle("🪙 コイン投げ")
      .setDescription(
        `あなたの選択: **${choice === "heads" ? "表" : "裏"}**\n` +
        `結果: **${result.result === "heads" ? "表" : "裏"}**`
      )
      .addFields(
        { name: "結果", value: result.win ? "🎉 勝ち！" : "💀 負け…" },
        { name: "所持金", value: `${result.money}` }
      );

    return interaction.reply({ embeds: [embed] });
  }
};
