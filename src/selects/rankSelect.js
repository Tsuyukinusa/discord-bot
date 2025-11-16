// src/selects/rankSelect.js
import { EmbedBuilder } from "discord.js";
import { readGuildDB } from "../utils/file.js";

export default async function rankSelectHandler(interaction) {
  const selected = interaction.values[0]; // "xp" or "vxp"
  const guildId = interaction.guild.id;

  const db = await readGuildDB();
  const guildData = db[guildId];

  if (!guildData || !guildData.users) {
    return interaction.reply({
      content: "⚠ データがありません。",
      ephemeral: true,
    });
  }

  // ===== ランキング作成 =====
  const ranking = Object.entries(guildData.users)
    .map(([userId, data]) => ({
      userId,
      value: selected === "xp" ? data.xp : data.vxp,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // トップ10

  const title = selected === "xp" ? "📘 XP ランキング" : "🎤 VXP ランキング";

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(0x00aaff)
    .setDescription(
      ranking
        .map(
          (u, i) =>
            `**${i + 1}位** <@${u.userId}> — **${u.value} ${
              selected === "xp" ? "XP" : "VXP"
            }**`
        )
        .join("\n")
    );

  return interaction.reply({ embeds: [embed] });
}
