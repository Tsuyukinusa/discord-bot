// src/commands/leveling/rank.js
import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("XP / VXP のランキング、またはプロフィールを表示します"),

  async execute(interaction) {

    const menu = new StringSelectMenuBuilder()
      .setCustomId("rank-select")
      .setPlaceholder("表示するものを選んでください")
      .addOptions([
        {
          label: "🏆 XP ランキング",
          value: "xp",
        },
        {
          label: "🎤 VXP ランキング",
          value: "vxp",
        },
        {
          label: "👤 プロフィールを表示",
          value: "profile",
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: "表示したい項目を選んでください！",
      components: [row],
      ephemeral: false,
    });
  },
};
