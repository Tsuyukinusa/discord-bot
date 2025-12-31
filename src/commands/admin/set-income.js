import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getGuild, updateGuild } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("setincome")
        .setDescription("work/slut/crime の収入設定を変更（管理者専用）")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName("command")
                .setDescription("対象コマンドを選択")
                .setRequired(true)
                .addChoices(
                    { name: "work", value: "work" },
                    { name: "slut", value: "slut" },
                    { name: "crime", value: "crime" }
                )
        )
        .addStringOption(opt =>
            opt.setName("type")
                .setDescription("money（お金）か diamond（ダイヤ）")
                .setRequired(true)
                .addChoices(
                    { name: "money（お金）", value: "money" },
                    { name: "diamond（ダイヤ）", value: "diamond" }
                )
        )
        .addIntegerOption(opt =>
            opt.setName("min")
                .setDescription("最小値")
                .setRequired(true)
        )
        .addIntegerOption(opt =>
            opt.setName("max")
                .setDescription("最大値")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const command = interaction.options.getString("command"); // work/slut/crime
        const type = interaction.options.getString("type");       // money/diamond
        const min = interaction.options.getInteger("min");
        const max = interaction.options.getInteger("max");

        if (min < 0 || max < 0 || min > max) {
            return interaction.reply("❌ **min <= max の形式で設定してください。**");
        }

        const guild = getGuild(guildId);

        // --- 対象を更新 ---
        guild.settings[command][`${type}Min`] = min;
        guild.settings[command][`${type}Max`] = max;

        updateGuild(guildId, guild);

        return interaction.reply(
            `✅ **${command} の ${type} 報酬を更新しました！**\n` +
            `最小: **${min}**\n最大: **${max}**`
        );
    },
};
