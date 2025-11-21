import {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("XP または VXP のランキングを表示します"),

  async execute(interaction) {
    // ▼ セレクトメニュー（XP/VXP）
    const menu = new StringSelectMenuBuilder()
      .setCustomId("rank-select")
      .setPlaceholder("ランキングの種類を選択")
      .addOptions([
        { label: "📘 XP ランキング", value: "xp" },
        { label: "🎤 VXP ランキング", value: "vxp" },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    // ▼ 埋め込みメッセージ
    const embed = new EmbedBuilder()
      .setColor(0x00aaff)
      .setTitle("🏆 ランキングを表示します")
      .setDescription("下のメニューから表示したいランキングを選んでください。")
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
