import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("XP または VXP のランキングを表示します"),

  async execute(interaction) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("rank-select")
      .setPlaceholder("ランキングの種類を選択")
      .addOptions([
        { label: "XP ランキング", value: "xp" },
        { label: "VXP ランキング", value: "vxp" },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      content: "表示するランキングを選んでください！",
      components: [row],
    });
  },
};
