import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("set-currency")
    .setDescription("サーバーの通貨記号を設定します（管理者のみ）")
    .addStringOption(option =>
      option
        .setName("symbol")
        .setDescription("設定したい通貨記号（絵文字も可）")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const symbol = interaction.options.getString("symbol");

    const db = await readGuildDB();

    // 経済データ初期化（もし無ければ）
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].economy) {
      db[guildId].economy = {
        enabled: false,
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
    }

    db[guildId].economy.currency = symbol;

    await writeGuildDB(db);

    return interaction.reply({
      content: `✅ 通貨記号が **${symbol}** に設定されました！`,
      ephemeral: false,
    });
  },
};
