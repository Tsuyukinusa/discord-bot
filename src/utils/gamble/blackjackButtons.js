import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export function blackjackButtons(game) {
  const disabled = game.finished;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("bj-hit")
      .setLabel("Hit")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),

    new ButtonBuilder()
      .setCustomId("bj-stand")
      .setLabel("Stand")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),

    new ButtonBuilder()
      .setCustomId("bj-double")
      .setLabel("Double")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || game.doubled || game.split),

    new ButtonBuilder()
      .setCustomId("bj-split")
      .setLabel("Split")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || game.split)
  );
}
