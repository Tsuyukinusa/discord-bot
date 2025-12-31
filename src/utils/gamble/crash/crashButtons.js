// utils/gamble/crashButtons.js
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export function crashButtons(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("crash-cashout")
      .setLabel("💰 CASH OUT")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled)
  );
}
