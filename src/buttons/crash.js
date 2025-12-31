import { EmbedBuilder } from "discord.js";
import {
  cashOutCrash,
  getCrash
} from "../utils/gamble/crashCore.js";
import { createCrashEmbed } from "../utils/gamble/crashEmbed.js";
import { crashButtons } from "../utils/gamble/crashButtons.js";

export default {
  customId: /^crash-(cashout)$/,

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const action = interaction.customId.split("-")[1];

    const crash = getCrash(guildId);

    // ゲームが存在しない
    if (!crash) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription("❌ クラッシュは開催されていません")
        ],
        ephemeral: true
      });
    }

    // キャッシュアウト
    if (action === "cashout") {
      const result = await cashOutCrash({ guildId, userId });

      if (result?.error) {
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setDescription(`❌ ${result.error}`)
          ],
          ephemeral: true
        });
      }

      // 最新状態を取得
      const updated = getCrash(guildId);

      return interaction.update({
        embeds: [createCrashEmbed(updated)],
        components: updated.finished ? [] : [crashButtons(updated)]
      });
    }
  }
};
