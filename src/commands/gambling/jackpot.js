import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { startJackpot, getJackpot } from "../../utils/gamble/jackpot/jackpotCore.js";
import { createJackpotEmbed } from "../../utils/gamble/jackpot/jackpotEmbed.js";
import { jackpotButtons } from "../../utils/gamble/jackpot/jackpotButtons.js";

export default {
  data: new SlashCommandBuilder()
    .setName("jackpot")
    .setDescription("ジャックポットを開始")
    .addIntegerOption(o =>
      o.setName("entry")
        .setDescription("参加費")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const entry = interaction.options.getInteger("entry");

    const jackpot = startJackpot({
      guildId,
      hostId: interaction.user.id,
      entry
    });

    if (jackpot.error) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor("Red").setDescription(jackpot.error)],
        ephemeral: true
      });
    }

    return interaction.reply({
      embeds: [createJackpotEmbed(jackpot)],
      components: [jackpotButtons()]
    });
  }
};
