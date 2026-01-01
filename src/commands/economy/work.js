import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getGuild, getUser, updateUser } from "../../utils/file.js";

export default {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("仕事してお金とダイヤを稼ぎます。"),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;

    const guild = getGuild(guildId);
    const user = getUser(guildId, userId);

    // --- 初期化 ---
    if (!user.balance) user.balance = 0;
    if (!user.diamond) user.diamond = 0;
    if (!user.cooldowns) user.cooldowns = {};
    if (!user.cooldowns.work) user.cooldowns.work = 0;

    const now = Date.now();

    // --- 設定の安全取得 ---
    const workSettings = guild?.settings?.work ?? {
      moneyMin: 50,
      moneyMax: 150,
      diamondMin: 0,
      diamondMax: 2
    };

    const cooldownSec = guild?.settings?.cooldown?.work ?? 60;
    const cooldownMs = cooldownSec * 1000;

    // --- クールダウン ---
    if (now - user.cooldowns.work < cooldownMs) {
      const remaining = Math.ceil(
        (cooldownMs - (now - user.cooldowns.work)) / 1000
      );

      const cdEmbed = new EmbedBuilder()
        .setColor("#ffcc00")
        .setTitle("⏳ クールダウン中")
        .setDescription(`あと **${remaining} 秒** 待ってください。`)
        .setTimestamp();

      return interaction.reply({
        embeds: [cdEmbed],
        ephemeral: true
      });
    }

    // --- ランダム報酬 ---
    const money =
      Math.floor(
        Math.random() *
          (workSettings.moneyMax - workSettings.moneyMin + 1)
      ) + workSettings.moneyMin;

    const diamond =
      Math.floor(
        Math.random() *
          (workSettings.diamondMax - workSettings.diamondMin + 1)
      ) + workSettings.diamondMin;

    // --- 更新 ---
    user.balance += money;
    user.diamond += diamond;
    user.cooldowns.work = now;

    updateUser(guildId, userId, user);

    // --- 成功 Embed ---
    const embed = new EmbedBuilder()
      .setColor("#00c3ff")
      .setTitle("💼 仕事完了！")
      .setDescription(`${interaction.user.username} さんの作業結果`)
      .addFields(
        {
          name: "💰 もらえたお金",
          value: `+ **${money.toLocaleString()}**`,
          inline: true
        },
        {
          name: "💎 もらえたダイヤ",
          value: `+ **${diamond.toLocaleString()}**`,
          inline: true
        },
        {
          name: "📊 現在の所持金",
          value: `**${user.balance.toLocaleString()}**`,
          inline: false
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
