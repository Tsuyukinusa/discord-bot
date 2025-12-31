import { EmbedBuilder } from "discord.js";

export function createRouletteWaitingEmbed(roulette) {
  const remain = Math.max(
    0,
    Math.ceil((roulette.endAt - Date.now()) / 1000)
  );

  return new EmbedBuilder()
    .setTitle("🎡 ルーレット")
    .setColor("#3498db")
    .setDescription("参加受付中！")
    .addFields(
      {
        name: "参加人数",
        value: `${roulette.bets.length} 人`,
        inline: true
      },
      {
        name: "残り時間",
        value: `${remain} 秒`,
        inline: true
      }
    );
}

export function createRouletteResultEmbed(result) {
  const winners = result.details
    .filter(d => d.win)
    .map(d => `<@${d.userId}>`)
    .join("、");

  return new EmbedBuilder()
    .setTitle("🎡 ルーレット結果")
    .setColor("#f1c40f")
    .setDescription(
      `**${result.result} (${result.color})** でした！`
    )
    .addFields({
      name: "勝者",
      value: winners || "なし"
    });
}
