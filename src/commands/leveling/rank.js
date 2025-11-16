// src/commands/leveling/rank.js

import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("ランキングメニューを表示します"),

  async execute(interaction) {

    const menu = new StringSelectMenuBuilder()
      .setCustomId("rank-select") // ← ready.js のハンドラと一致！
      .setPlaceholder("表示するランキングを選択…")
      .addOptions([
        {
          label: "🏆 XP ランキング",
          value: "xp",
          description: "サーバー内の XP ランキングを表示",
        },
        {
          label: "🎤 VXP ランキング",
          value: "vxp",
          description: "通話ポイント（VXP）のランキング",
        },
        {
          label: "🪪 プロフィールを見る",
          value: "profile",
          description: "自分のプロフィールカードを表示",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: "📊 表示する項目を選んでください！",
      components: [row],
      ephemeral: true,
    });
  },
};
