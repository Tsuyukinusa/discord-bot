import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getGuild, getUser, updateUser } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("仕事してお金とダイヤを稼ぎます。"),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const userId = interaction.user.id;

        const guild = getGuild(guildId);
        const user = getUser(guildId, userId);

        const now = Date.now();

        // =====================
        // 初期化（超重要）
        // =====================
        if (typeof user.balance !== "number") user.balance = 0;
        if (typeof user.diamond !== "number") user.diamond = 0;
        if (!user.cooldowns) user.cooldowns = {};
        if (!guild.settings) guild.settings = {};
        if (!guild.settings.cooldown) guild.settings.cooldown = {};
        if (!guild.settings.work) {
            guild.settings.work = {
                moneyMin: 10,
                moneyMax: 50,
                diamondMin: 0,
                diamondMax: 1
            };
        }

        // =====================
        // クールダウン処理
        // =====================
        const cdSeconds = guild.settings.cooldown.work ?? 60;
        const cd = cdSeconds * 1000;

        if (user.cooldowns.work && now - user.cooldowns.work < cd) {
            const remaining = Math.ceil(
                (cd - (now - user.cooldowns.work)) / 1000
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

        // =====================
        // 報酬計算
        // =====================
        const money =
            Math.floor(
                Math.random() *
                (guild.settings.work.moneyMax - guild.settings.work.moneyMin + 1)
            ) + guild.settings.work.moneyMin;

        const diamond =
            Math.floor(
                Math.random() *
                (guild.settings.work.diamondMax - guild.settings.work.diamondMin + 1)
            ) + guild.settings.work.diamondMin;

        // =====================
        // 更新
        // =====================
        user.balance += money;
        user.diamond += diamond;
        user.cooldowns.work = now;

        updateUser(guildId, userId, user);

        // =====================
        // Embed
        // =====================
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
    },
};
