import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getGuild, updateGuild } from "../../utils/guildDB.js";

export default {
    data: new SlashCommandBuilder()
        .setName("setfailrate")
        .setDescription("slut または crime の失敗率を設定します（管理者専用）")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName("command")
                .setDescription("対象コマンド")
                .setRequired(true)
                .addChoices(
                    { name: "slut", value: "slut" },
                    { name: "crime", value: "crime" }
                )
        )
        .addIntegerOption(opt =>
            opt.setName("percent")
                .setDescription("失敗率（0〜100）")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const cmd = interaction.options.getString("command");
        const percent = interaction.options.getInteger("percent");

        if (percent < 0 || percent > 100) {
            return interaction.reply("❌ 失敗率は **0〜100%** の間で指定してください。");
        }

        const guild = getGuild(guildId);

        guild[cmd].failRate = percent;

        updateGuild(guildId, guild);

        return interaction.reply(
            `✅ **${cmd} の失敗率を ${percent}% に設定しました！**`
        );
    }
};
