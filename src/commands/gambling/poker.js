import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { playPoker } from "../../utils/gamble/pokerCore.js";
import { createPokerEmbed } from "../../utils/gamble/pokerEmbed.js";

export default {
  data: new SlashCommandBuilder()
    .setName("poker")
    .setDescription("ポーカーをプレイします")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("賭け金")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const bet = interaction.options.getInteger("bet");

    const result = await playPoker({
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      bet
    });

    if (result.error) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor("Red").setDescription(result.error)],
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [createPokerEmbed(result)]
    });
  }
};
