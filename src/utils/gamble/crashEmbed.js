import { EmbedBuilder } from "discord.js";

/**
 * Crash ゲーム用 Embed
 */
export function createCrashEmbed({
  multiplier,
  bet,
  cashedOut = false,
  crashed = false,
  payout = 0,
  playerId,
  countdown = null
}) {
  const embed = new EmbedBuilder()
    .setTitle("💥 Crash")
    .setColor(
      crashed ? "Red" :
      cashedOut ? "Green" :
      "Orange"
    )
    .addFields(
      { name: "現在倍率", value: `**${multiplier.toFixed(2)}x**`, inline: true },
      { name: "賭け金", value: `${bet}`, inline: true }
    );

  // 進行中
  if (!crashed && !cashedOut) {
    embed.setDescription("📈 倍率上昇中…");
  }

  // Cash Out 成功
  if (cashedOut) {
    embed.setDescription(
      `💰 <@${playerId}> が **${multiplier.toFixed(2)}x** でキャッシュアウト！`
    );
    embed.addFields(
      { name: "獲得額", value: `${payout}`, inline: false }
    );
  }

  // Crash
  if (crashed) {
    embed.setDescription("💥 クラッシュしました！");
    embed.addFields(
      { name: "結果", value: "❌ 賭け金は失われました", inline: false }
    );
  }

  // 開始前カウントダウンなど
  if (countdown !== null) {
    embed.setFooter({ text: `開始まで ${countdown} 秒` });
  }

  return embed;
}
