// utils/gamble/pokerButtons.js
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} from "discord.js";

export function pokerExchangeComponents(game) {
  const hand = game.hand; // [{ suit, value, display }...]

  // カード選択メニュー
  const select = new StringSelectMenuBuilder()
    .setCustomId("poker-select")
    .setPlaceholder("交換したいカードを選択（複数可）")
    .setMinValues(0)
    .setMaxValues(hand.length)
    .addOptions(
      hand.map((card, index) => ({
        label: card.display,
        value: String(index)
      }))
    );

  const row1 = new ActionRowBuilder().addComponents(select);

  // 実行・確定ボタン
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("poker-exchange")
      .setLabel("🔄 交換する")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("poker-stand")
      .setLabel("✅ この手で確定")
      .setStyle(ButtonStyle.Success)
  );

  return [row1, row2];
}
