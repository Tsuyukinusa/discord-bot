import { SlashCommandBuilder } from "discord.js";
import { startBlackjack } from "../../utils/gamble/blackjack/blackjackStore.js";
import { createBlackjackEmbed } from "../../utils/gamble/blackjack/blackjackEmbed.js";
import { blackjackButtons } from "../../utils/gamble/blackjack/blackjackButtons.js";

export default {
  data: new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("ブラックジャックをプレイします")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("賭け金")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const game = await startBlackjack({
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      bet: interaction.options.getInteger("bet")
    });

    if (game.error) {
      return interaction.reply({ content: game.error, ephemeral: true });
    }

    await interaction.reply({
      embeds: [createBlackjackEmbed(game)],
      components: [blackjackButtons(game)]
    });
  }
};
