// src/buttons/crash.js
import { EmbedBuilder } from "discord.js";
import { cashOut } from "../utils/gamble/crash/crashCore.js";
import { createCrashEmbed } from "../utils/gamble/crashEmbed.js";

export default {
  customId: "crash-cashout",

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const result = await cashOut(guildId, userId);
    if (result.error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(result.error)
        ],
        ephemeral: true
      });
    }

    return interaction.update({
      embeds: [
        createCrashEmbed({
          multiplier: result.multiplier,
          status: "cashed",
          win: result.win
        })
      ],
      components: []
    });
  }
};
