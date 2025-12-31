import { EmbedBuilder } from "discord.js";
import {
  joinJackpot,
  closeJackpot,
  getJackpot
} from "../utils/gamble/jackpot/jackpotCore.js";
import { createJackpotEmbed } from "../utils/gamble/jackpotEmbed.js";
import { jackpotButtons } from "../utils/gamble/jackpotButtons.js";

export default {
  customId: /^jackpot-(join|close)$/,

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const action = interaction.customId.split("-")[1];

    if (action === "join") {
      const result = await joinJackpot({ guildId, userId });
      if (result?.error) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor("Red").setDescription(result.error)],
          ephemeral: true
        });
      }

      return interaction.update({
        embeds: [createJackpotEmbed(getJackpot(guildId))],
        components: [jackpotButtons()]
      });
    }

    if (action === "close") {
      const result = await closeJackpot(guildId);

      if (result.canceled) {
        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor("Grey")
              .setDescription("参加者がいなかったため中止されました")
          ],
          components: []
        });
      }

      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor("Gold")
            .setTitle("🎉 ジャックポット当選！")
            .setDescription(
              `<@${result.winnerId}> が **${result.pot}** を獲得しました！`
            )
        ],
        components: []
      });
    }
  }
};
