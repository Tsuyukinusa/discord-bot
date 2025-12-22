import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { playDiceGame } from "../../utils/gamble/diceCore.js";
import { createDiceEmbed } from "../../utils/gamble/diceEmbed.js";

export default {
  data: new SlashCommandBuilder()
    .setName("dice")
    .setDescription("ダイスでギャンブルします")
    .addIntegerOption(o =>
      o.setName("dice")
        .setDescription("サイコロの数 (1〜3)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(3)
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
          { name: "Pair (2 dice)", value: "pair" },
          { name: "Triple (3 dice)", value: "triple" },
          { name: "Straight (3 dice)", value: "straight" }
        )
    )
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("賭け金")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const diceCount = interaction.options.getInteger("dice");
    const betType = interaction.options.getString("type");
    const bet = interaction.options.getInteger("bet");

    const result = await playDiceGame({
      guildId,
      userId,
      diceCount,
      betType,
      bet
    });

    if (result.error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`❌ ${result.error}`)
        ],
        ephemeral: true
      });
    }

    const embed = createDiceEmbed(result);
    await interaction.reply({ embeds: [embed] });
  }
};
