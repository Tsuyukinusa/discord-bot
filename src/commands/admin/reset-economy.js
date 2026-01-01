import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("reseteconomy")
    .setDescription("経済システムと全ユーザーの所持金を完全にリセットします（管理者のみ）")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;

    const db = await readGuildDB();
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].users) db[guildId].users = {};

    /* ======================
       経済設定リセット
    ====================== */
    const startBalance = 1000;

    db[guildId].economy = {
      enabled: false,
      currency: "💰",
      startBalance,

      cooldowns: {
        work: 60,
        slut: 60,
        crime: 60,
      },

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

    /* ======================
       全ユーザー所持金リセット
    ====================== */
    let resetCount = 0;

    for (const userId in db[guildId].users) {
      db[guildId].users[userId].balance = startBalance;
      resetCount++;
    }

    await writeGuildDB(db);

    /* ======================
       Embed
    ====================== */
    const embed = new EmbedBuilder()
      .setTitle("🔄 経済システム完全リセット")
      .setDescription(
        "経済設定と **全ユーザーの所持金** を初期状態に戻しました。"
      )
      .setColor(0x00A6FF)
      .addFields(
        { name: "💰 初期所持金", value: `${startBalance}`, inline: true },
        { name: "👥 リセット人数", value: `${resetCount} 人`, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
