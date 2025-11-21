import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { getGuild, updateGuild } from "../../utils/guildDB.js";

export default {
    data: new SlashCommandBuilder()
        .setName("setreply")
        .setDescription("カスタム返信を追加します（管理者専用）")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(opt =>
            opt.setName("type")
                .setDescription("success または fail")
                .setRequired(true)
                .addChoices(
                    { name: "success", value: "success" },
                    { name: "fail", value: "fail" }
                )
        )
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
        .addStringOption(opt =>
            opt.setName("text")
                .setDescription("追加したいメッセージ（{user} でユーザー名に置換される）")
                .setRequired(true)
        ),

    async execute(interaction) {
        const type = interaction.options.getString("type");      // success or fail
        const cmd = interaction.options.getString("command");    // work / slut / crime
        const text = interaction.options.getString("text");      // 追加文

        // fail に work は指定できない
        if (type === "fail" && cmd === "work") {
            return interaction.reply("❌ **fail は work に設定できません。slut か crime のみです。**");
        }

        const guildId = interaction.guild.id;
        const guild = getGuild(guildId);

        // replies が存在しない場合の保険
        if (!guild.replies) {
            guild.replies = {
                success: { work: [], slut: [], crime: [] },
                fail: { slut: [], crime: [] }
            };
        }

        // 対象配列へ追加
        guild.replies[type][cmd].push(text);

        updateGuild(guildId, guild);

        return interaction.reply(
            `✅ **${type} の ${cmd} に新しい返信を追加しました！**\n追加内容: \`${text}\``
        );
    }
};
