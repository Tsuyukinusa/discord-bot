import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("set-start-balance")
    .setDescription("新規ユーザーの初期所持金を設定します（管理者のみ）")
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("初期所持金（0以上）")
        .setRequired(true)
        .setMinValue(0)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const amount = interaction.options.getInteger("amount");

    const db = await readGuildDB();

    // サーバーデータがなければ作る
    if (!db[guildId]) db[guildId] = {};

    // economyがなければ、Reset economy コマンドで作る想定なのでここでは何もしない
    if (!db[guildId].economy) {
      return interaction.reply({
        content: "⚠️ 経済システムがまだ初期化されていません。\n`/economy-reset` を先に実行してください。",
        ephemeral: true,
      });
    }

    // 初期所持金を設定
    db[guildId].economy.startBalance = amount;

    await writeGuildDB(db);

    return interaction.reply({
      content: `✅ 初期所持金が **${amount}** に設定されました！`,
      ephemeral: false,
    });
  },
}
