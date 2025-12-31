import { EmbedBuilder } from "discord.js";

export function createJackpotEmbed(jackpot) {
  return new EmbedBuilder()
    .setTitle("💰 ジャックポット")
    .setColor("#f1c40f")
    .addFields(
      { name: "参加費", value: `${jackpot.entry}`, inline: true },
      { name: "参加人数", value: `${jackpot.players.length}`, inline: true },
      { name: "現在のプール", value: `${jackpot.pot}`, inline: true }
    )
    .setFooter({
      text: jackpot.open ? "参加ボタンを押して参加！" : "締切済み"
    });
}
