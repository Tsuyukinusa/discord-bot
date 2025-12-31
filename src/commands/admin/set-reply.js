import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder
} from "discord.js";
import { getGuild, updateGuild } from "../../utils/core/file.js";

export default {
    data: new SlashCommandBuilder()
        .setName("setreply")
        .setDescription("カスタム返信を設定します（管理者のみ）")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addStringOption(option =>
            option
                .setName("type")
                .setDescription("成功メッセージか失敗メッセージかを選択")
                .setRequired(true)
                .addChoices(
                    { name: "成功（success）", value: "success" },
                    { name: "失敗（fail）", value: "fail" }
                )
        )

        .addStringOption(option =>
            option
                .setName("category")
                .setDescription("どのコマンドの返信か？")
                .setRequired(true)
                .addChoices(
                    { name: "work", value: "work" },
                    { name: "slut", value: "slut" },
                    { name: "crime", value: "crime" }
                )
        )

        .addStringOption(option =>
            option
                .setName("message")
                .setDescription("登録したいカスタムメッセージ（{money} など使えます）")
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const type = interaction.options.getString("type");
        const category = interaction.options.getString("category");
        const message = interaction.options.getString("message");

        // fail は work 非対応
        if (type === "fail" && category === "work") {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle("❌ エラー")
                        .setDescription("`work` の失敗メッセージは設定できません。")
                ],
                ephemeral: true
            });
        }

        const guild = getGuild(guildId);

        guild.settings.replies[type][category].push(message);
        updateGuild(guildId, guild);

        // 成功したあとの埋め込み
        const embed = new EmbedBuilder()
            .setColor(0x00c3ff)
            .setTitle("✅ カスタム返信を追加しました")
            .addFields(
                {
                    name: "種類",
                    value: type === "success" ? "成功 (success)" : "失敗 (fail)",
                    inline: true
                },
                {
                    name: "カテゴリ",
                    value: category,
                    inline: true
                },
                {
                    name: "追加された内容",
                    value: "```\n" + message + "\n```"
                }
            )
            .setFooter({
                text: "テンプレート: {user} {money} {diamond} {failMoney} など利用可能"
            });

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
};
