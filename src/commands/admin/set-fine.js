import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getGuild, updateGuild } from "../../utils/guildDB.js";

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
        const command = interaction.options.getString("command"); // slut or crime
        const min = interaction.options.getInteger("min");
        const max = interaction.options.getInteger("max");

        // === エラーチェック ===
        if (min < 0 || max < 0) {
            return interaction.reply("❌ **罰金は 0 以上を設定してください。**");
        }
        if (min > max) {
            return interaction.reply("❌ **min は max 以下にしてください。**");
        }

        // === Guild 設定読み込み ===
        const guild = getGuild(guildId);

        // === 対象コマンドの罰金を更新 ===
        guild.settings[command].fineMin = min;
        guild.settings[command].fineMax = max;

        // === 保存 ===
        updateGuild(guildId, guild);

        return interaction.reply(
            `✅ **${command} の罰金額を更新しました！**\n` +
            `最小: **${min}**\n最大: **${max}**`
        );
    },
};
