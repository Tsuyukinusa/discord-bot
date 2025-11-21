import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getGuild, updateGuild } from "../../utils/guildDB.js";

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
            return interaction.reply("❌ クールダウンは 0 秒以上にしてください。");
        }

        const guild = getGuild(guildId);

        guild.cooldowns[target] = seconds * 1000; // ← ミリ秒に変換

        updateGuild(guildId, guild);

        return interaction.reply(
            `✅ **${target} のクールダウンを ${seconds} 秒 に設定しました！**`
        );
    }
};
