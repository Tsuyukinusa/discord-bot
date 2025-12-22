// buttons/blackjack.js
import { hit, stand } from "../utils/gamble/blackjackCore.js";
import { createBlackjackEmbed } from "../utils/gamble/blackjackEmbed.js";
import { blackjackButtons } from "../utils/gamble/blackjackButtons.js";

export default {
  customId: /^bj-/,

  async execute(interaction) {
    const state = interaction.client.blackjack?.[interaction.user.id];
    if (!state) {
      return interaction.reply({ content: "❌ ゲームが見つかりません", ephemeral: true });
    }

    if (interaction.customId === "bj-hit") hit(state);
    if (interaction.customId === "bj-stand") stand(state);

    const end = state.status === "end";

    await interaction.update({
      embeds: [
        createBlackjackEmbed(state, end)
          .setFooter({ text: end ? `結果: ${state.result}` : "" })
      ],
      components: [blackjackButtons(end)]
    });
  }
};
