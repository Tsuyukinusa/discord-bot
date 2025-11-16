// src/commands/leveling/rank.js
import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("XP / VXP / プロフィール を選択して表示"),

  async execute(interaction) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("rank-select")
      .setPlaceholder("表示したい内容を選んでください")
      .addOptions([
        {
          label: "XP ランキング",
          value: "xp",
        },
        {
          label: "VXP ランキング",
          value: "vxp",
        },
        {
          label: "プロフィールを見る",
          value: "profile",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: "表示するデータを選んでください！",
      components: [row],
    });
  },
};
