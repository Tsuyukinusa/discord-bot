import { EmbedBuilder } from "discord.js";

/**
 * @param {Object} data
 * @param {number} data.result
 * @param {string} data.color
 * @param {Array} data.details
 */
export function createRouletteResultEmbed({ result, color, details }) {
  const winners = details
    .filter(d => d.win)
    .map(d => `<@${d.userId}>`);

  const colorMap = {
    red: 0xe74c3c,
    black: 0x2c3e50,
    green: 0x2ecc71
  };

  const embed = new EmbedBuilder()
    .setTitle("🎰 ルーレット結果")
    .setColor(colorMap[color] ?? 0xffffff)
    .setDescription(
      `**${result} 番 (${color}) でした！**`
    );

  if (winners.length > 0) {
    embed.addFields({
      name: "🎉 勝者",
      value: winners.join("、"),
      inline: false
    });
  } else {
    embed.addFields({
      name: "😢 勝者なし",
      value: "今回は当たりがありませんでした",
      inline: false
    });
  }

  return embed;
}
