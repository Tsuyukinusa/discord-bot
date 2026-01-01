import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";
import {
  addBalance,
  subtractBalance,
  getBalance
} from "../../Services/economyServices.js";

export default {
  data: new SlashCommandBuilder()
    .setName("slut")
    .setDescription("危険な仕事をしてお金とダイヤを稼ぎます。"),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const db = await readGuildDB();
    const guild = db[guildId];
    const user = guild?.users?.[userId];

    if (!guild || !user) {
      return interaction.reply({
        content: "ユーザーデータが見つかりません。",
        ephemeral: true
      });
    }

    const now = Date.now();

    /* ======================
       クールダウン
    ====================== */
    const cd = guild.economy.cooldowns.slut * 1000;
    if (user.cooldowns?.slut && now - user.cooldowns.slut < cd) {
      const remaining = Math.ceil((cd - (now - user.cooldowns.slut)) / 1000);

      const embed = new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle("⏳ クールダウン中")
        .setDescription(`あと **${remaining}秒** 待ってね。`);

      return interaction.reply({ embeds: [embed] });
    }

    /* ======================
       成功 / 失敗判定
    ====================== */
    const failRate = guild.economy.failRates.slut * 100;
    const isFail = Math.random() * 100 < failRate;

    let description = "";
    let color = 0x00c3ff;

    /* ======================
       成功
    ====================== */
    if (!isFail) {
      const income = guild.economy.income.slut;

      const money =
        Math.floor(Math.random() * (income.max - income.min + 1)) +
        income.min;

      const diamond =
        Math.floor(
          Math.random() *
            (income.diamond.max - income.diamond.min + 1)
        ) + income.diamond.min;

      await addBalance(guildId, userId, money);
      user.diamond = (user.diamond ?? 0) + diamond;

      description =
        `💋 **成功！**\n` +
        `💰 お金: +**${money}**\n` +
        `💎 ダイヤ: +**${diamond}**`;
    }

    /* ======================
       失敗
    ====================== */
    else {
      const fine = guild.economy.fines.slut;

      const loss =
        Math.floor(Math.random() * (fine.max - fine.min + 1)) +
        fine.min;

      await subtractBalance(guildId, userId, loss);
      color = 0xff0000;

      description =
        `💔 **失敗…**\n` +
        `罰金: -**${loss}**`;
    }

    /* ======================
       セーブ
    ====================== */
    user.cooldowns = user.cooldowns ?? {};
    user.cooldowns.slut = now;

    await writeGuildDB(db);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("💋 Slut 結果")
      .setDescription(description);

    return interaction.reply({ embeds: [embed] });
  }
};
