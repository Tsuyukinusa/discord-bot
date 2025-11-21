import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";
import { ensureEconomy } from "../../utils/initEconomy.js";

export default {
  data: new SlashCommandBuilder()
    .setName("set-currency")
    .setDescription("サーバーの通貨記号を設定します（管理者のみ）")
    .addStringOption(option =>
      option
        .setName("symbol")
        .setDescription("設定する通貨記号（絵文字OK）")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const symbol = interaction.options.getString("symbol");

    const db = await readGuildDB();

    // 共通の初期化
    ensureEconomy(db, guildId);

    db[guildId].economy.currency = symbol;

    await writeGuildDB(db);

    return interaction.reply({
      content: `💱 通貨記号が **${symbol}** に変更されました！`,
      ephemeral: false,
    });
  },
};
