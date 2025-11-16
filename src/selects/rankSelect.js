// src/selects/rankSelect.js
import { EmbedBuilder } from "discord.js";
import { readGuildDB } from "../utils/file.js"; // utils の読み込みパスはプロジェクト構成に合わせて調整

export default async function rankSelectHandler(interaction, client) {
  try {
    if (!interaction.isStringSelectMenu()) return;
    const value = interaction.values[0]; // "xp" または "vxp"
    const guildId = interaction.guildId;

    const db = await readGuildDB();
    const guildData = db[guildId] || {};
    const users = guildData.users || {};

    // users: { userId: { xp, vxp, ... } }
    const list = Object.entries(users).map(([uid, u]) => {
      return {
        id: uid,
        xp: u.xp || 0,
        vxp: u.vxp || 0,
      };
    });

    // ソートしてトップ10を作る
    const top = list
      .sort((a, b) => (value === "vxp" ? b.vxp - a.vxp : b.xp - a.xp))
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setTitle(value === "vxp" ? "🎧 VXP ランキング" : "📜 XP ランキング")
      .setColor(value === "vxp" ? 0x1db954 : 0xffd166)
      .setTimestamp();

    if (top.length === 0) {
      embed.setDescription("まだデータがありません。");
      // メニューを消して更新
      return interaction.update({ content: null, embeds: [embed], components: [] });
    }

    let desc = "";
    for (let i = 0; i < top.length; i++) {
      const row = top[i];
      const member = await interaction.guild.members.fetch(row.id).catch(() => null);
      const name = member ? member.user.tag : `<@${row.id}>`;
      const val = value === "vxp" ? row.vxp : row.xp;
      desc += `**${i + 1}.** ${name} — ${val}\n`;
    }

    embed.setDescription(desc);

    // 更新（元のメッセージをメニューなしで置き換える）
    await interaction.update({ content: null, embeds: [embed], components: [] });
  } catch (err) {
    console.error("rankSelectHandler error:", err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "❌ ランキングの取得中にエラーが発生しました。", ephemeral: true });
    } else {
      await interaction.followUp({ content: "❌ ランキングの取得中にエラーが発生しました。", ephemeral: true });
    }
  }
}
