import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("start-economy")
    .setDescription("サーバーの経済システムを開始します")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const db = await readGuildDB();

    // すでに開始されている場合
    if (db[guildId]?.economy?.enabled) {
      return interaction.reply({
        content: "⚠️ このサーバーではすでに経済システムが開始されています！",
        ephemeral: true,
      });
    }

    // 経済システムを初期化
    db[guildId] = db[guildId] || {};
    db[guildId].economy = {
      enabled: true,
      currency: "💰",
      startBalance: 100,
      cooldowns: {
        work: 3600,
        slut: 7200,
        crime: 7200,
      },
      income: {
        work: { min: 10, max: 50, diamond: 1 },
        slut: { min: 20, max: 100, diamond: 2 },
        crime: { min: 30, max: 120, diamond: 3 },
      },
      fines: {
        slut: { min: 10, max: 40 },
        crime: { min: 10, max: 60 },
      },
      failRates: {
        slut: 0.3,
        crime: 0.3,
      },
      interestRate: 0.01,
      roleIncome: {},
      customReplies: {}
    };

    await writeGuildDB(db);

    return interaction.reply({
      content: "✅ **経済システムを開始しました！**",
      ephemeral: false,
    });
  },
};
