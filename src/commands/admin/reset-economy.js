
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("reseteconomy")
    .setDescription("経済システムを初期状態にリセットします（管理者のみ）")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    const db = await readGuildDB();
    if (!db[guildId]) db[guildId] = {};

    // 🔧 経済データ完全リセット（クールダウン秒単位）
    db[guildId].economy = {
      enabled: false,
      currency: "💰",
      startBalance: 1000,

      // ⏱ 秒単位
      cooldowns: {
        work: 60,     // 10秒
        slut: 60,     // 20秒
        crime: 60,    // 30秒
      },

      // 💎 ダイヤも min/max 対応
      income: {
        work:  { min: 1500, max: 2000, diamond: { min: 1, max: 5 } },
        slut:  { min: 2300, max: 2800, diamond: { min: 7, max: 12 } },
        crime: { min: 10000, max: 20000, diamond: { min: 10, max: 20 } },
      },

      fines: {
        slut: { min: 1800, max: 2000 },
        crime: { min: 10000, max: 20000 },
      },

      failRates: {
        slut: 0.0,
        crime: 0.0,
      },

      interestRate: 0.001,
      roleIncome: {},
      customReplies: {}
    };

    await writeGuildDB(db);

    // --- Embed ---
    const embed = new EmbedBuilder()
      .setTitle("🔄 経済システムをリセットしました")
      .setDescription("すべての経済設定が **初期状態** に戻りました。")
      .setColor(0x00A6FF)
      .addFields(
        { name: "💰 初期所持金", value: "100", inline: true },
        {
          name: "⏱ クールダウン（秒）",
          value: "• work: 10秒\n• slut: 20秒\n• crime: 30秒",
          inline: true
        },
        {
          name: "💎 ダイヤ報酬（初期値）",
          value:
            "• work: 1〜3\n" +
            "• slut: 2〜5\n" +
            "• crime: 3〜7",
          inline: true
        }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
