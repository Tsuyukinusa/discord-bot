// utils/gamble/crashEmbed.js
import { EmbedBuilder } from "discord.js";

export function createCrashEmbed({ multiplier, status, win }) {
  const embed = new EmbedBuilder()
    .setTitle("💥 CRASH")
    .setColor(status === "crashed" ? "Red" : "#f1c40f")
    .setDescription(`現在倍率: **${multiplier.toFixed(2)}x**`);

  if (status === "cashed") {
    embed.addFields({
      name: "🎉 キャッシュアウト成功",
      value: `獲得額: **${win}**`
    });
  }

  if (status === "crashed") {
    embed.addFields({
      name: "💀 クラッシュ！",
      value: "何も獲得できませんでした"
    });
  }

  return embed;
}
