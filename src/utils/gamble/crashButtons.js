import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

/**
 * @param {Object} game
 * @param {boolean} game.running  クラッシュ進行中か
 * @param {boolean} game.cashedOut すでにキャッシュアウトしたか
 */
export function crashButtons(game) {
  const disabled = !game.running || game.cashedOut;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("crash-cashout")
      .setLabel("💰 Cash Out")
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled)
  );
}
