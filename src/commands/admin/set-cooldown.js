import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} from "discord.js";
import { getGuild, updateGuild } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("setcooldown")
        .setDescription("work / slut / crime のクールダウンを秒単位で設定します（管理者専用）")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName("command")
                .setDescription("対象コマンド")
                .setRequired(true)
                .addChoices(
                    { name: "work", value: "work" },
                    { name: "slut", value: "slut" },
                    { name: "crime", value: "crime" }
                )
        )
        .addIntegerOption(opt =>
            opt.setName("seconds")
                .setDescription("クールダウン（秒）")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const target = interaction.options.getString("command");
        const seconds = interaction.options.getInteger("seconds");

        if (seconds < 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff4444)
                .setTitle("❌ 無効な値")
                .setDescription("クールダウンは **0秒以上** で設定してください。");

            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const guild = getGuild(guildId);

        // 秒 → ミリ秒へ変換
        guild.cooldowns[target] = seconds * 1000;

        updateGuild(guildId, guild);

        const embed = new EmbedBuilder()
            .setColor(0x00aaff)
            .setTitle("⏱ クールダウン設定完了")
            .addFields(
                { name: "コマンド", value: `\`${target}\``, inline: true },
                { name: "設定秒数", value: `**${seconds} 秒**`, inline: true }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
