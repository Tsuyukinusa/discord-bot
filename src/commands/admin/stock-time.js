import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits
} from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("stock-time")
    .setDescription("株価変動の時刻を設定します（管理者専用）")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName("action")
        .setDescription("操作")
        .setRequired(true)
        .addChoices(
          { name: "追加", value: "add" },
          { name: "削除", value: "remove" }
        )
    )
    .addStringOption(o =>
      o.setName("time")
        .setDescription("時刻（HH:MM）")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const action = interaction.options.getString("action");
    const time = interaction.options.getString("time");

    // フォーマットチェック
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return interaction.reply({
        content: "❌ 時刻は **HH:MM** 形式で入力してください。",
        ephemeral: true
      });
    }

    const db = await readGuildDB();
    if (!db[guildId]) db[guildId] = {};
    if (!db[guildId].stockConfig) {
      db[guildId].stockConfig = {
        updateTimes: [],
        lastRun: null
      };
    }

    const times = db[guildId].stockConfig.updateTimes;

    if (action === "add") {
      if (times.includes(time)) {
        return interaction.reply({
          content: "⚠️ その時刻はすでに登録されています。",
          ephemeral: true
        });
      }
      times.push(time);
    }

    if (action === "remove") {
      if (!times.includes(time)) {
        return interaction.reply({
          content: "❌ その時刻は登録されていません。",
          ephemeral: true
        });
      }
      db[guildId].stockConfig.updateTimes = times.filter(t => t !== time);
    }

    await writeGuildDB(db);

    const embed = new EmbedBuilder()
      .setColor("#4caf50")
      .setTitle("⏰ 株価変動時刻 更新")
      .addFields(
        { name: "操作", value: action === "add" ? "追加" : "削除" },
        { name: "時刻", value: time },
        {
          name: "現在の設定",
          value: db[guildId].stockConfig.updateTimes.join(", ") || "なし"
        }
      );

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
