import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export function jackpotButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("jackpot-join")
      .setLabel("参加する")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("jackpot-close")
      .setLabel("締切")
      .setStyle(ButtonStyle.Danger)
  );
}
