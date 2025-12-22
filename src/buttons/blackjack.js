import { EmbedBuilder } from "discord.js";
import {
  playHit,
  playStand,
  playDouble,
  playSplit
} from "../utils/gamble/blackjackCore.js";
import { createBlackjackEmbed } from "../utils/gamble/blackjackEmbed.js";
import { blackjackButtons } from "../utils/gamble/blackjackButtons.js";
import { getGame } from "../utils/gamble/blackjackStore.js";

export default {
  customId: /^bj-(hit|stand|double|split)$/,

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const action = interaction.customId.split("-")[1];

    const game = getGame(guildId, userId);
    if (!game) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("このゲームはあなたのものではありません")
        ],
        ephemeral: true
      });
    }

    let result;
    if (action === "hit") result = await playHit(guildId, userId);
    if (action === "stand") result = await playStand(guildId, userId);
    if (action === "double") result = await playDouble(guildId, userId);
    if (action === "split") result = await playSplit(guildId, userId);

    if (result?.error) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(result.error)
        ],
        ephemeral: true
      });
    }

    await interaction.update({
      embeds: [createBlackjackEmbed(result)],
      components: result.finished ? [] : [blackjackButtons(result)]
    });
  }
};
