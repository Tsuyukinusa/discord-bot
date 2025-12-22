// commands/gambling/dice.js
import { SlashCommandBuilder } from "discord.js";
import { playDice } from "../../utils/gamble/DiceCore.js";
import { createDiceEmbed } from "../../utils/gamble/diceEmbed.js";

export default {
  data: new SlashCommandBuilder()
    .setName("dice")
    .setDescription("ダイスでギャンブル")
    .addIntegerOption(o =>
      o.setName("count").setDescription("ダイス数").setRequired(true).setMinValue(1).setMaxValue(3)
    )
    .addStringOption(o =>
      o.setName("type")
        .setDescription("賭け方")
        .setRequired(true)
        .addChoices(
          { name: "Odd", value: "odd" },
          { name: "Even", value: "even" },
          { name: "High", value: "high" },
          { name: "Low", value: "low" },
          { name: "Pair", value: "pair" },
          { name: "Triple", value: "triple" },
          { name: "Straight", value: "straight" }
        )
    )
    .addIntegerOption(o =>
      o.setName("bet").setDescription("賭け金").setRequired(true).setMinValue(1)
    ),

  async execute(interaction) {
    const result = await playDice({
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      diceCount: interaction.options.getInteger("count"),
      betType: interaction.options.getString("type"),
      bet: interaction.options.getInteger("bet")
    });

    if (result.error) {
      return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }

    return interaction.reply({ embeds: [createDiceEmbed(result)] });
  }
};
