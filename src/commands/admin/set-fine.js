import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { readGuildDB, writeGuildDB } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("setfine")
        .setDescription("slut / crime の罰金額を設定（管理者専用）")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName("command")
                .setDescription("対象コマンドを選択")
                .setRequired(true)
                .addChoices(
                    { name: "slut", value: "slut" },
                    { name: "crime", value: "crime" }
                )
        )
        .addIntegerOption(opt =>
            opt.setName("min")
                .setDescription("罰金の最小値")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("max")
                .setDescription("罰金の最大値")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const command = interaction.options.getString("command");
        const min = interaction.options.getInteger("min");
        const max = interaction.options.getInteger("max");

        // ===== エラー Embed =====
        if (min < 0 || max < 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ エラー")
                .setDescription("罰金額は **0 以上** を設定してください。");

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (min > max) {
            const errorEmbed = new EmbedBuilder()
                .setColor("Red")
                .setTitle("❌ エラー")
                .setDescription("**min は max 以下** にしてください。");

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        // ===== Guild データ読み込み =====
        const guild = readGuildDB(guildId);

        // ===== 設定更新 =====
        guild.settings[command].fineMin = min;
        guild.settings[command].fineMax = max;

        writeGuildDB(guildId, guild);

        // ===== 成功 Embed =====
        const successEmbed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("💰 罰金設定を更新しました")
            .setDescription(
                `**${command} の罰金額が更新されました！**\n\n` +
                `🔻 **最小額:** ${min}\n` +
                `🔺 **最大額:** ${max}`
            )
            .setTimestamp();

        return interaction.reply({ embeds: [successEmbed] });
    },
};
