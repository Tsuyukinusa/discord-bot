import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from "discord.js";

import { readGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("サーバーの資産ランキングを表示します"),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const db = await readGuildDB();

    const users = db[guildId]?.users ?? {};

    // --- ユーザー配列化（balance基準） ---
    const usersArray = Object.entries(users).map(([id, data]) => ({
      id,
      balance: data.balance ?? 0
    }));

    if (usersArray.length === 0) {
      return interaction.reply({
        content: "❌ ランキングに表示できるユーザーがいません。",
        ephemeral: true
      });
    }

    // --- 降順ソート ---
    usersArray.sort((a, b) => b.balance - a.balance);

    // --- ページング ---
    const page = 1;
    const perPage = 10;
    const maxPage = Math.ceil(usersArray.length / perPage);
    const show = usersArray.slice(0, perPage);

    // --- 埋め込み ---
    const embed = new EmbedBuilder()
      .setTitle("🏆 資産ランキング - Leaderboard")
      .setColor(0xffcc00)
      .setFooter({ text: `ページ ${page} / ${maxPage}` })
      .setDescription(
        show
          .map((u, i) => {
            const rank = i + 1;
            return `**${rank}位** <@${u.id}> — 💰 **${u.balance.toLocaleString()}**`;
          })
          .join("\n")
      );

    // --- ボタン ---
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rank-prev:${page}`)
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId(`rank-next:${page}`)
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(maxPage <= 1)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
