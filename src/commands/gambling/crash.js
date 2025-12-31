// src/commands/gambling/crash.js
import { SlashCommandBuilder } from "discord.js";
import { startCrash, tickCrash } from "../../utils/gamble/crashCore.js";
import { createCrashEmbed } from "../../utils/gamble/crashEmbed.js";
import { crashButtons } from "../../utils/gamble/crashButtons.js";

export default {
  data: new SlashCommandBuilder()
    .setName("crash")
    .setDescription("クラッシュを開始します")
    .addIntegerOption(o =>
      o.setName("bet")
        .setDescription("賭け金")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const bet = interaction.options.getInteger("bet");

    const game = await startCrash({ guildId, userId, bet });
    if (game.error) {
      return interaction.reply({ content: game.error, ephemeral: true });
    }

    const message = await interaction.reply({
      embeds: [createCrashEmbed({ multiplier: 1.0 })],
      components: [crashButtons()],
      fetchReply: true
    });

    const interval = setInterval(async () => {
      const res = tickCrash(guildId, userId);
      if (!res) return clearInterval(interval);

      if (res.crashed) {
        clearInterval(interval);
        return message.edit({
          embeds: [
            createCrashEmbed({
              multiplier: res.game.multiplier,
              status: "crashed"
            })
          ],
          components: []
        });
      }

      message.edit({
        embeds: [createCrashEmbed({ multiplier: res.game.multiplier })]
      });
    }, 1000);
  }
};
