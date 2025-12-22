import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { calcHand } from "./blackjackLogic.js";

export function blackjackButtons(game) {
  const hand = game.hands[game.currentHand];

  const canDouble =
    hand.length === 2 && !game.doubled && !game.split;

  const canSplit =
    hand.length === 2 &&
    hand[0].value === hand[1].value &&
    !game.split;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("bj-hit")
      .setLabel("Hit")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(game.finished),

    new ButtonBuilder()
      .setCustomId("bj-stand")
      .setLabel("Stand")
      .setStyle(ButtonStyle.Success)
      .setDisabled(game.finished),

    new ButtonBuilder()
      .setCustomId("bj-double")
      .setLabel("Double")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!canDouble),

    new ButtonBuilder()
      .setCustomId("bj-split")
      .setLabel("Split")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!canSplit)
  );
}
